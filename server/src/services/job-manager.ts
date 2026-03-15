import { ChildProcessWithoutNullStreams } from "child_process";
import { Response } from "express";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

export type JobStatus =
  | "pending"
  | "processing"
  | "done"
  | "error"
  | "stopped";

export interface Job {
  id: string;
  status: JobStatus;
  progress: string;
  inputPath: string;
  outputPath: string;
  model: string;
  scale: string;
  error?: string;
  createdAt: number;
  process?: {
    child: ChildProcessWithoutNullStreams;
    kill: () => boolean;
  };
  sseClients: Response[];
}

class JobManager {
  private jobs: Map<string, Job> = new Map();

  /** Periodic cleanup: delete files and jobs older than 5 minutes */
  constructor() {
    setInterval(() => this.cleanup(), 60 * 1000); // check every minute
  }

  createJob(params: {
    inputPath: string;
    outputPath: string;
    model: string;
    scale: string;
  }): Job {
    const job: Job = {
      id: uuidv4(),
      status: "pending",
      progress: "",
      inputPath: params.inputPath,
      outputPath: params.outputPath,
      model: params.model,
      scale: params.scale,
      createdAt: Date.now(),
      sseClients: [],
    };
    this.jobs.set(job.id, job);
    return job;
  }

  getJob(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  updateJob(id: string, updates: Partial<Job>): void {
    const job = this.jobs.get(id);
    if (job) {
      Object.assign(job, updates);
    }
  }

  /** Broadcast SSE event to all clients subscribed to this job */
  broadcastProgress(jobId: string, event: string, data: string): void {
    const job = this.jobs.get(jobId);
    if (!job) return;
    job.sseClients.forEach((res) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    });
  }

  addSSEClient(jobId: string, res: Response): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.sseClients.push(res);
    }
  }

  removeSSEClient(jobId: string, res: Response): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.sseClients = job.sseClients.filter((c) => c !== res);
    }
  }

  stopJob(id: string): boolean {
    const job = this.jobs.get(id);
    if (job && job.process) {
      job.process.kill();
      job.status = "stopped";
      this.broadcastProgress(id, "stopped", "Job stopped by user");
      return true;
    }
    return false;
  }

  deleteJob(id: string): void {
    const job = this.jobs.get(id);
    if (job?.process) {
      job.process.kill();
    }
    this.jobs.delete(id);
  }

  private cleanup(): void {
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    for (const [id, job] of this.jobs.entries()) {
      if (
        job.createdAt < tenMinutesAgo &&
        (job.status === "done" || job.status === "error" || job.status === "stopped")
      ) {
        // Delete uploaded input file
        try {
          if (fs.existsSync(job.inputPath)) {
            fs.unlinkSync(job.inputPath);
            console.log(`🗑️ Deleted input file: ${job.inputPath}`);
          }
        } catch (err) {
          console.error(`Failed to delete input file: ${job.inputPath}`, err);
        }

        // Delete output result file
        try {
          if (fs.existsSync(job.outputPath)) {
            fs.unlinkSync(job.outputPath);
            console.log(`🗑️ Deleted output file: ${job.outputPath}`);
          }
        } catch (err) {
          console.error(`Failed to delete output file: ${job.outputPath}`, err);
        }

        this.jobs.delete(id);
        console.log(`🧹 Cleaned up job ${id} (created ${Math.round((Date.now() - job.createdAt) / 1000)}s ago)`);
      }
    }
  }
}

export const jobManager = new JobManager();
