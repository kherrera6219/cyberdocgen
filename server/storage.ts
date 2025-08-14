import { type CompanyProfile, type InsertCompanyProfile, type Document, type InsertDocument, type GenerationJob, type InsertGenerationJob } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Company Profile methods
  getCompanyProfile(id: string): Promise<CompanyProfile | undefined>;
  getCompanyProfiles(): Promise<CompanyProfile[]>;
  createCompanyProfile(profile: InsertCompanyProfile): Promise<CompanyProfile>;
  updateCompanyProfile(id: string, profile: Partial<InsertCompanyProfile>): Promise<CompanyProfile | undefined>;
  
  // Document methods
  getDocument(id: string): Promise<Document | undefined>;
  getDocuments(): Promise<Document[]>;
  getDocumentsByCompanyProfile(companyProfileId: string): Promise<Document[]>;
  getDocumentsByFramework(framework: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: string, document: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: string): Promise<boolean>;
  
  // Generation Job methods
  getGenerationJob(id: string): Promise<GenerationJob | undefined>;
  getGenerationJobs(): Promise<GenerationJob[]>;
  getGenerationJobsByCompanyProfile(companyProfileId: string): Promise<GenerationJob[]>;
  createGenerationJob(job: InsertGenerationJob): Promise<GenerationJob>;
  updateGenerationJob(id: string, job: Partial<InsertGenerationJob>): Promise<GenerationJob | undefined>;
}

export class MemStorage implements IStorage {
  private companyProfiles: Map<string, CompanyProfile>;
  private documents: Map<string, Document>;
  private generationJobs: Map<string, GenerationJob>;

  constructor() {
    this.companyProfiles = new Map();
    this.documents = new Map();
    this.generationJobs = new Map();
  }

  // Company Profile methods
  async getCompanyProfile(id: string): Promise<CompanyProfile | undefined> {
    return this.companyProfiles.get(id);
  }

  async getCompanyProfiles(): Promise<CompanyProfile[]> {
    return Array.from(this.companyProfiles.values());
  }

  async createCompanyProfile(insertProfile: InsertCompanyProfile): Promise<CompanyProfile> {
    const id = randomUUID();
    const now = new Date();
    const profile: CompanyProfile = {
      ...insertProfile,
      cloudInfrastructure: insertProfile.cloudInfrastructure || [],
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.companyProfiles.set(id, profile);
    return profile;
  }

  async updateCompanyProfile(id: string, updateData: Partial<InsertCompanyProfile>): Promise<CompanyProfile | undefined> {
    const existing = this.companyProfiles.get(id);
    if (!existing) return undefined;

    const updated: CompanyProfile = {
      ...existing,
      ...updateData,
      cloudInfrastructure: updateData.cloudInfrastructure || existing.cloudInfrastructure,
      updatedAt: new Date(),
    };
    this.companyProfiles.set(id, updated);
    return updated;
  }

  // Document methods
  async getDocument(id: string): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values()).sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async getDocumentsByCompanyProfile(companyProfileId: string): Promise<Document[]> {
    return Array.from(this.documents.values())
      .filter(doc => doc.companyProfileId === companyProfileId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getDocumentsByFramework(framework: string): Promise<Document[]> {
    return Array.from(this.documents.values())
      .filter(doc => doc.framework === framework)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = randomUUID();
    const now = new Date();
    const document: Document = {
      ...insertDocument,
      description: insertDocument.description || null,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.documents.set(id, document);
    return document;
  }

  async updateDocument(id: string, updateData: Partial<InsertDocument>): Promise<Document | undefined> {
    const existing = this.documents.get(id);
    if (!existing) return undefined;

    const updated: Document = {
      ...existing,
      ...updateData,
      description: updateData.description !== undefined ? updateData.description : existing.description,
      updatedAt: new Date(),
    };
    this.documents.set(id, updated);
    return updated;
  }

  async deleteDocument(id: string): Promise<boolean> {
    return this.documents.delete(id);
  }

  // Generation Job methods
  async getGenerationJob(id: string): Promise<GenerationJob | undefined> {
    return this.generationJobs.get(id);
  }

  async getGenerationJobs(): Promise<GenerationJob[]> {
    return Array.from(this.generationJobs.values());
  }

  async getGenerationJobsByCompanyProfile(companyProfileId: string): Promise<GenerationJob[]> {
    return Array.from(this.generationJobs.values())
      .filter(job => job.companyProfileId === companyProfileId);
  }

  async createGenerationJob(insertJob: InsertGenerationJob): Promise<GenerationJob> {
    const id = randomUUID();
    const now = new Date();
    const job: GenerationJob = {
      ...insertJob,
      status: insertJob.status || "pending",
      progress: insertJob.progress || 0,
      documentsGenerated: insertJob.documentsGenerated || 0,
      totalDocuments: insertJob.totalDocuments || 0,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.generationJobs.set(id, job);
    return job;
  }

  async updateGenerationJob(id: string, updateData: Partial<InsertGenerationJob>): Promise<GenerationJob | undefined> {
    const existing = this.generationJobs.get(id);
    if (!existing) return undefined;

    const updated: GenerationJob = {
      ...existing,
      ...updateData,
      updatedAt: new Date(),
    };
    this.generationJobs.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
