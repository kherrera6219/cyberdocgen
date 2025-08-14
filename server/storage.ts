import { 
  users, 
  organizations, 
  userOrganizations, 
  companyProfiles, 
  documents, 
  generationJobs,
  type User,
  type UpsertUser,
  type InsertUser,
  type Organization,
  type InsertOrganization,
  type UserOrganization,
  type InsertUserOrganization,
  type CompanyProfile, 
  type InsertCompanyProfile, 
  type Document, 
  type InsertDocument, 
  type GenerationJob, 
  type InsertGenerationJob 
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Organization operations
  getOrganizations(): Promise<Organization[]>;
  getOrganization(id: string): Promise<Organization | undefined>;
  getOrganizationBySlug(slug: string): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: string, org: Partial<InsertOrganization>): Promise<Organization | undefined>;
  
  // User-Organization operations
  getUserOrganizations(userId: string): Promise<UserOrganization[]>;
  getOrganizationUsers(organizationId: string): Promise<UserOrganization[]>;
  addUserToOrganization(membership: InsertUserOrganization): Promise<UserOrganization>;
  updateUserOrganizationRole(userId: string, organizationId: string, role: string): Promise<UserOrganization | undefined>;
  removeUserFromOrganization(userId: string, organizationId: string): Promise<boolean>;

  // Company Profile methods
  getCompanyProfile(id: string): Promise<CompanyProfile | undefined>;
  getCompanyProfiles(organizationId?: string): Promise<CompanyProfile[]>;
  createCompanyProfile(profile: InsertCompanyProfile): Promise<CompanyProfile>;
  updateCompanyProfile(id: string, profile: Partial<InsertCompanyProfile>): Promise<CompanyProfile | undefined>;
  
  // Document methods
  getDocument(id: string): Promise<Document | undefined>;
  getDocuments(organizationId?: string): Promise<Document[]>;
  getDocumentsByCompanyProfile(companyProfileId: string): Promise<Document[]>;
  getDocumentsByFramework(framework: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: string, document: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: string): Promise<boolean>;
  
  // Generation Job methods
  getGenerationJob(id: string): Promise<GenerationJob | undefined>;
  getGenerationJobs(organizationId?: string): Promise<GenerationJob[]>;
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

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Organization operations
  async getOrganizations(): Promise<Organization[]> {
    return await db.select().from(organizations).orderBy(desc(organizations.createdAt));
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org || undefined;
  }

  async getOrganizationBySlug(slug: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.slug, slug));
    return org || undefined;
  }

  async createOrganization(insertOrg: InsertOrganization): Promise<Organization> {
    const [org] = await db
      .insert(organizations)
      .values(insertOrg)
      .returning();
    return org;
  }

  async updateOrganization(id: string, updateData: Partial<InsertOrganization>): Promise<Organization | undefined> {
    const [org] = await db
      .update(organizations)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(organizations.id, id))
      .returning();
    return org || undefined;
  }

  // User-Organization operations
  async getUserOrganizations(userId: string): Promise<UserOrganization[]> {
    return await db.select().from(userOrganizations).where(eq(userOrganizations.userId, userId));
  }

  async getOrganizationUsers(organizationId: string): Promise<UserOrganization[]> {
    return await db.select().from(userOrganizations).where(eq(userOrganizations.organizationId, organizationId));
  }

  async addUserToOrganization(membership: InsertUserOrganization): Promise<UserOrganization> {
    const [userOrg] = await db
      .insert(userOrganizations)
      .values(membership)
      .returning();
    return userOrg;
  }

  async updateUserOrganizationRole(userId: string, organizationId: string, role: string): Promise<UserOrganization | undefined> {
    const [userOrg] = await db
      .update(userOrganizations)
      .set({ role })
      .where(and(
        eq(userOrganizations.userId, userId),
        eq(userOrganizations.organizationId, organizationId)
      ))
      .returning();
    return userOrg || undefined;
  }

  async removeUserFromOrganization(userId: string, organizationId: string): Promise<boolean> {
    const result = await db
      .delete(userOrganizations)
      .where(and(
        eq(userOrganizations.userId, userId),
        eq(userOrganizations.organizationId, organizationId)
      ));
    return result.rowCount > 0;
  }

  // Company Profile methods
  async getCompanyProfile(id: string): Promise<CompanyProfile | undefined> {
    const [profile] = await db.select().from(companyProfiles).where(eq(companyProfiles.id, id));
    return profile || undefined;
  }

  async getCompanyProfiles(organizationId?: string): Promise<CompanyProfile[]> {
    if (organizationId) {
      return await db
        .select()
        .from(companyProfiles)
        .where(eq(companyProfiles.organizationId, organizationId))
        .orderBy(desc(companyProfiles.updatedAt));
    }
    return await db.select().from(companyProfiles).orderBy(desc(companyProfiles.updatedAt));
  }

  async createCompanyProfile(insertProfile: InsertCompanyProfile): Promise<CompanyProfile> {
    const [profile] = await db
      .insert(companyProfiles)
      .values(insertProfile)
      .returning();
    return profile;
  }

  async updateCompanyProfile(id: string, updateData: Partial<InsertCompanyProfile>): Promise<CompanyProfile | undefined> {
    const [profile] = await db
      .update(companyProfiles)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(companyProfiles.id, id))
      .returning();
    return profile || undefined;
  }

  // Document methods
  async getDocument(id: string): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document || undefined;
  }

  async getDocuments(organizationId?: string): Promise<Document[]> {
    if (organizationId) {
      return await db
        .select({
          id: documents.id,
          companyProfileId: documents.companyProfileId,
          createdBy: documents.createdBy,
          title: documents.title,
          description: documents.description,
          framework: documents.framework,
          category: documents.category,
          content: documents.content,
          status: documents.status,
          version: documents.version,
          reviewedBy: documents.reviewedBy,
          reviewedAt: documents.reviewedAt,
          approvedBy: documents.approvedBy,
          approvedAt: documents.approvedAt,
          createdAt: documents.createdAt,
          updatedAt: documents.updatedAt,
        })
        .from(documents)
        .innerJoin(companyProfiles, eq(documents.companyProfileId, companyProfiles.id))
        .where(eq(companyProfiles.organizationId, organizationId))
        .orderBy(desc(documents.updatedAt));
    }
    return await db.select().from(documents).orderBy(desc(documents.updatedAt));
  }

  async getDocumentsByCompanyProfile(companyProfileId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.companyProfileId, companyProfileId))
      .orderBy(desc(documents.updatedAt));
  }

  async getDocumentsByFramework(framework: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.framework, framework))
      .orderBy(desc(documents.updatedAt));
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values(insertDocument)
      .returning();
    return document;
  }

  async updateDocument(id: string, updateData: Partial<InsertDocument>): Promise<Document | undefined> {
    const [document] = await db
      .update(documents)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return document || undefined;
  }

  async deleteDocument(id: string): Promise<boolean> {
    const result = await db.delete(documents).where(eq(documents.id, id));
    return result.rowCount > 0;
  }

  // Generation Job methods
  async getGenerationJob(id: string): Promise<GenerationJob | undefined> {
    const [job] = await db.select().from(generationJobs).where(eq(generationJobs.id, id));
    return job || undefined;
  }

  async getGenerationJobs(organizationId?: string): Promise<GenerationJob[]> {
    if (organizationId) {
      return await db
        .select({
          id: generationJobs.id,
          companyProfileId: generationJobs.companyProfileId,
          createdBy: generationJobs.createdBy,
          framework: generationJobs.framework,
          status: generationJobs.status,
          progress: generationJobs.progress,
          documentsGenerated: generationJobs.documentsGenerated,
          totalDocuments: generationJobs.totalDocuments,
          errorMessage: generationJobs.errorMessage,
          completedAt: generationJobs.completedAt,
          createdAt: generationJobs.createdAt,
          updatedAt: generationJobs.updatedAt,
        })
        .from(generationJobs)
        .innerJoin(companyProfiles, eq(generationJobs.companyProfileId, companyProfiles.id))
        .where(eq(companyProfiles.organizationId, organizationId))
        .orderBy(desc(generationJobs.createdAt));
    }
    return await db.select().from(generationJobs).orderBy(desc(generationJobs.createdAt));
  }

  async getGenerationJobsByCompanyProfile(companyProfileId: string): Promise<GenerationJob[]> {
    return await db
      .select()
      .from(generationJobs)
      .where(eq(generationJobs.companyProfileId, companyProfileId))
      .orderBy(desc(generationJobs.createdAt));
  }

  async createGenerationJob(insertJob: InsertGenerationJob): Promise<GenerationJob> {
    const [job] = await db
      .insert(generationJobs)
      .values(insertJob)
      .returning();
    return job;
  }

  async updateGenerationJob(id: string, updateData: Partial<InsertGenerationJob>): Promise<GenerationJob | undefined> {
    const [job] = await db
      .update(generationJobs)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(generationJobs.id, id))
      .returning();
    return job || undefined;
  }
}

export const storage = new DatabaseStorage();
