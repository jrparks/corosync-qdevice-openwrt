import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json());

// Initialize Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper to list all feed and package files
const getFeedFilesList = () => {
  const rootDir = process.cwd();
  const results: Array<{ path: string; relativePath: string; size: number; content: string }> = [];

  const addFile = (relPath: string) => {
    const fullPath = path.join(rootDir, relPath);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      results.push({
        path: fullPath,
        relativePath: relPath,
        size: fs.statSync(fullPath).size,
        content: fs.readFileSync(fullPath, 'utf8'),
      });
    }
  };

  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else {
        const relativePath = path.relative(rootDir, fullPath);
        results.push({
          path: fullPath,
          relativePath,
          size: stat.size,
          content: fs.readFileSync(fullPath, 'utf8'),
        });
      }
    }
  };

  // Walk package directory
  walk(path.join(rootDir, 'package'));

  // Root configuration and script files
  addFile('Dockerfile');
  addFile('build.sh');
  addFile('run-build.sh');
  addFile('README.md');
  addFile('.github/workflows/build.yml');

  // Fallback to openwrt-feed if package was empty
  if (results.length === 0) {
    walk(path.join(rootDir, 'openwrt-feed'));
  }

  return results;
};

// API: Get feed files metadata & content
app.get('/api/feed/files', (_req: Request, res: Response) => {
  try {
    const files = getFeedFilesList();
    res.json({ success: true, files });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Download full feed as a .tar.gz tarball
app.get('/api/feed/download', (_req: Request, res: Response) => {
  try {
    const tmpTar = path.join('/tmp', `corosync-openwrt-repo-${Date.now()}.tar.gz`);
    const rootDir = process.cwd();

    // Package package/, Dockerfile, build.sh, run-build.sh, README.md, .github/
    execSync(
      `tar -czf "${tmpTar}" -C "${rootDir}" package Dockerfile build.sh run-build.sh README.md .github`,
      { stdio: 'ignore' }
    );

    res.download(tmpTar, 'corosync-qnetd-openwrt-latest.tar.gz', (err) => {
      try {
        if (fs.existsSync(tmpTar)) fs.unlinkSync(tmpTar);
      } catch {
        // ignore cleanup error
      }
      if (err && !res.headersSent) {
        res.status(500).send('Error downloading archive');
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API: Download git bundle (full commit history & branches)
app.get('/api/feed/bundle', (_req: Request, res: Response) => {
  try {
    const bundlePath = path.join('/tmp', 'corosync-qnetd-openwrt.bundle');
    execSync(`git bundle create "${bundlePath}" master`, { stdio: 'ignore' });
    res.download(bundlePath, 'corosync-qnetd-openwrt.bundle');
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API: Gemini Architecture & Troubleshooting Assistant
app.post('/api/gemini/assist', async (req: Request, res: Response) => {
  try {
    const { prompt, context } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured in environment secrets.',
      });
    }

    const systemInstruction = `You are a Principal Embedded Linux & OpenWrt Systems Engineer specializing in Corosync 3, Kronosnet, Proxmox VE high availability clusters, musl libc cross-compilation, and OpenWrt 23.05-SNAPSHOT packaging.
Provide precise, technically authoritative answers, commands, and Makefile configurations. Highlight musl vs glibc differences, CPU architectures (ARM64, Cortex-A53, x86_64, MIPS), and Proxmox VE quorum dynamics (votequorum, tie-breaker, split-brain protection). Be concise and actionable.`;

    const fullPrompt = `${context ? `[Context]:\n${JSON.stringify(context, null, 2)}\n\n` : ''}[User Question]:\n${prompt}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: fullPrompt,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    res.json({ answer: response.text });
  } catch (err: any) {
    console.error('Gemini API error:', err);
    res.status(500).json({ error: err.message || 'Error processing request' });
  }
});

// Setup Vite or Static Serving
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Corosync OpenWrt Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
