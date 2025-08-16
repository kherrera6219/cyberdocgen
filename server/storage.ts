// @ts-nocheck

import {
  users,
  organizations,
  userOrganizations,
  companyProfiles, 
  documents, 
  generationJobs,
  gapAnalysisReports,
  gapAnalysisFindings,
  remediationRecommendations,
  complianceMaturityAssessments,
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
  type InsertGenerationJob,
  type GapAnalysisReport,
  type InsertGapAnalysisReport,
  type GapAnalysisFinding,
  type InsertGapAnalysisFinding,
  type RemediationRecommendation,
  type InsertRemediationRecommendation,
  type ComplianceMaturityAssessment,
  type InsertComplianceMaturityAssessment 
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
  private users: Map<string, User>;
  private organizations: Map<string, Organization>;
  private userOrganizations: Map<string, UserOrganization>;
  private companyProfiles: Map<string, CompanyProfile>;
  private documents: Map<string, Document>;
  private generationJobs: Map<string, GenerationJob>;

  constructor() {
    this.users = new Map();
    this.organizations = new Map();
    this.userOrganizations = new Map();
    this.companyProfiles = new Map();
    this.documents = new Map();
    this.generationJobs = new Map();
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = randomUUID();
    const now = new Date();
    const newUser: User = {
      ...user,
      id,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      profileImageUrl: user.profileImageUrl || null,
      role: user.role || "user",
      isActive: user.isActive ?? true,
      lastLoginAt: user.lastLoginAt || null,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const existing = this.users.get(id);
    if (!existing) return undefined;

    const updated: User = {
      ...existing,
      ...user,
      updatedAt: new Date(),
    };
    this.users.set(id, updated);
    return updated;
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    const id = user.id;
    if (!id) {
      throw new Error("User ID is required for upsert operation");
    }
    
    const existing = this.users.get(id);
    if (existing) {
      const { id: userId, ...updateData } = user;
      const updated = await this.updateUser(userId, updateData);
      if (!updated) {
        throw new Error("Failed to update user");
      }
      return updated;
    } else {
      const { id: userId, ...insertUser } = user;
      const newUser = await this.createUser(insertUser);
      this.users.set(userId, { ...newUser, id: userId });
      return { ...newUser, id: userId };
    }
  }

  // Organization operations
  async getOrganizations(): Promise<Organization[]> {
    return Array.from(this.organizations.values());
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    return this.organizations.get(id);
  }

  async getOrganizationBySlug(slug: string): Promise<Organization | undefined> {
    return Array.from(this.organizations.values()).find(org => org.slug === slug);
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const id = randomUUID();
    const now = new Date();
    const newOrg: Organization = {
      ...org,
      id,
      isActive: org.isActive ?? true,
      description: org.description || null,
      logo: org.logo || null,
      website: org.website || null,
      contactEmail: org.contactEmail || null,
      createdAt: now,
      updatedAt: now,
    };
    this.organizations.set(id, newOrg);
    return newOrg;
  }

  async updateOrganization(id: string, org: Partial<InsertOrganization>): Promise<Organization | undefined> {
    const existing = this.organizations.get(id);
    if (!existing) return undefined;

    const updated: Organization = {
      ...existing,
      ...org,
      updatedAt: new Date(),
    };
    this.organizations.set(id, updated);
    return updated;
  }

  // User-Organization operations
  async getUserOrganizations(userId: string): Promise<UserOrganization[]> {
    return Array.from(this.userOrganizations.values()).filter(uo => uo.userId === userId);
  }

  async getOrganizationUsers(organizationId: string): Promise<UserOrganization[]> {
    return Array.from(this.userOrganizations.values()).filter(uo => uo.organizationId === organizationId);
  }

  async addUserToOrganization(membership: InsertUserOrganization): Promise<UserOrganization> {
    const id = randomUUID();
    const now = new Date();
    const newMembership: UserOrganization = {
      ...membership,
      id,
      role: membership.role || "member",
      joinedAt: now,
    };
    this.userOrganizations.set(id, newMembership);
    return newMembership;
  }

  async updateUserOrganizationRole(userId: string, organizationId: string, role: string): Promise<UserOrganization | undefined> {
    const membership = Array.from(this.userOrganizations.values())
      .find(uo => uo.userId === userId && uo.organizationId === organizationId);
    
    if (!membership) return undefined;

    const updated: UserOrganization = {
      ...membership,
      role,
    };
    this.userOrganizations.set(membership.id, updated);
    return updated;
  }

  async removeUserFromOrganization(userId: string, organizationId: string): Promise<boolean> {
    const membership = Array.from(this.userOrganizations.entries())
      .find(([, uo]) => uo.userId === userId && uo.organizationId === organizationId);
    
    if (!membership) return false;

    this.userOrganizations.delete(membership[0]);
    return true;
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
      id,
      cloudInfrastructure: Array.isArray(insertProfile.cloudInfrastructure) ? insertProfile.cloudInfrastructure : [],
      isActive: insertProfile.isActive ?? true,
      keyPersonnel: insertProfile.keyPersonnel || null,
      frameworkConfigs: insertProfile.frameworkConfigs || null,
      uploadedDocs: insertProfile.uploadedDocs || null,
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
      cloudInfrastructure: Array.isArray(updateData.cloudInfrastructure) ? updateData.cloudInfrastructure : existing.cloudInfrastructure,
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
      id,
      createdAt: now,
      updatedAt: now,
      description: insertDocument.description || null,
      status: insertDocument.status || "draft",
      version: insertDocument.version || 1,
      subFramework: insertDocument.subFramework || null,
      documentType: insertDocument.documentType || "text",
      templateData: insertDocument.templateData || null,
      tags: Array.isArray(insertDocument.tags) ? insertDocument.tags : null,
      fileName: insertDocument.fileName || null,
      fileType: insertDocument.fileType || null,
      fileSize: insertDocument.fileSize || null,
      downloadUrl: insertDocument.downloadUrl || null,
      reviewedBy: insertDocument.reviewedBy || null,
      reviewedAt: insertDocument.reviewedAt || null,
      approvedBy: insertDocument.approvedBy || null,
      approvedAt: insertDocument.approvedAt || null,
      publishedAt: insertDocument.publishedAt || null,
      approvalRequired: insertDocument.approvalRequired || false,
      aiGenerated: insertDocument.aiGenerated || false,
      aiModel: insertDocument.aiModel || null,
      generationPrompt: insertDocument.generationPrompt || null,
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
      tags: Array.isArray(updateData.tags) ? updateData.tags : existing.tags,
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
      id,
      status: insertJob.status || "pending",
      progress: insertJob.progress || 0,
      documentsGenerated: insertJob.documentsGenerated || 0,
      totalDocuments: insertJob.totalDocuments || 0,
      errorMessage: insertJob.errorMessage || null,
      completedAt: insertJob.completedAt || null,
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

  // Gap Analysis methods
  async createGapAnalysisReport(report: InsertGapAnalysisReport): Promise<GapAnalysisReport> {
    const id = randomUUID();
    const newReport = { ...report, id, createdAt: new Date(), updatedAt: new Date() };
    this.gapAnalysisReports.set(id, newReport);
    return newReport;
  }

  async getGapAnalysisReports(organizationId: string): Promise<GapAnalysisReport[]> {
    return Array.from(this.gapAnalysisReports.values())
      .filter(report => report.organizationId === organizationId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getGapAnalysisReport(id: string): Promise<GapAnalysisReport | undefined> {
    return this.gapAnalysisReports.get(id);
  }

  async updateGapAnalysisReport(id: string, updates: Partial<GapAnalysisReport>): Promise<GapAnalysisReport> {
    const existing = this.gapAnalysisReports.get(id);
    if (!existing) throw new Error('Report not found');
    
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.gapAnalysisReports.set(id, updated);
    return updated;
  }

  async createGapAnalysisFinding(finding: InsertGapAnalysisFinding): Promise<GapAnalysisFinding> {
    const id = randomUUID();
    const newFinding = { ...finding, id, createdAt: new Date(), updatedAt: new Date() };
    this.gapAnalysisFindings.set(id, newFinding);
    return newFinding;
  }

  async getGapAnalysisFindings(reportId: string): Promise<GapAnalysisFinding[]> {
    return Array.from(this.gapAnalysisFindings.values())
      .filter(finding => finding.reportId === reportId)
      .sort((a, b) => b.priority - a.priority);
  }

  async createRemediationRecommendation(recommendation: InsertRemediationRecommendation): Promise<RemediationRecommendation> {
    const id = randomUUID();
    const newRecommendation = { ...recommendation, id, createdAt: new Date(), updatedAt: new Date() };
    this.remediationRecommendations.set(id, newRecommendation);
    return newRecommendation;
  }

  async getRemediationRecommendations(findingId: string): Promise<RemediationRecommendation[]> {
    return Array.from(this.remediationRecommendations.values())
      .filter(rec => rec.findingId === findingId)
      .sort((a, b) => b.priority - a.priority);
  }

  async updateRemediationRecommendation(id: string, updates: Partial<RemediationRecommendation>): Promise<RemediationRecommendation> {
    const existing = this.remediationRecommendations.get(id);
    if (!existing) throw new Error('Recommendation not found');
    
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.remediationRecommendations.set(id, updated);
    return updated;
  }

  async createComplianceMaturityAssessment(assessment: InsertComplianceMaturityAssessment): Promise<ComplianceMaturityAssessment> {
    const id = randomUUID();
    const newAssessment = { ...assessment, id, createdAt: new Date(), updatedAt: new Date() };
    this.complianceMaturityAssessments.set(id, newAssessment);
    return newAssessment;
  }

  async getComplianceMaturityAssessment(organizationId: string, framework: string): Promise<ComplianceMaturityAssessment | undefined> {
    return Array.from(this.complianceMaturityAssessments.values())
      .filter(assessment => 
        assessment.organizationId === organizationId && 
        assessment.framework === framework
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  }

  // Private storage
  private gapAnalysisReports = new Map<string, GapAnalysisReport>();
  private gapAnalysisFindings = new Map<string, GapAnalysisFinding>();
  private remediationRecommendations = new Map<string, RemediationRecommendation>();
  private complianceMaturityAssessments = new Map<string, ComplianceMaturityAssessment>();
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
    return (result.rowCount ?? 0) > 0;
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
      .values([insertProfile])
      .returning();
    return profile;
  }

  async updateCompanyProfile(id: string, updateData: Partial<InsertCompanyProfile>): Promise<CompanyProfile | undefined> {
    const updateValues = {
      ...updateData,
      updatedAt: new Date(),
      // Ensure array fields are properly handled
      cloudInfrastructure: Array.isArray(updateData.cloudInfrastructure) ? updateData.cloudInfrastructure : undefined,
    };
    
    // Remove undefined values to prevent database errors
    const cleanUpdateValues = Object.fromEntries(
      Object.entries(updateValues).filter(([, value]) => value !== undefined)
    );
    
    const [profile] = await db
      .update(companyProfiles)
      .set(cleanUpdateValues)
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
        .select()
        .from(documents)
        .innerJoin(companyProfiles, eq(documents.companyProfileId, companyProfiles.id))
        .where(eq(companyProfiles.organizationId, organizationId))
        .orderBy(desc(documents.updatedAt))
        .then(results => results.map(result => result.documents));
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
      .values([insertDocument])
      .returning();
    return document;
  }

  async updateDocument(id: string, updateData: Partial<InsertDocument>): Promise<Document | undefined> {
    const updateValues = {
      ...updateData,
      updatedAt: new Date(),
      // Ensure array fields are properly handled
      tags: Array.isArray(updateData.tags) ? updateData.tags : undefined,
    };
    
    // Remove undefined values to prevent database errors
    const cleanUpdateValues = Object.fromEntries(
      Object.entries(updateValues).filter(([, value]) => value !== undefined)
    );
    
    const [document] = await db
      .update(documents)
      .set(cleanUpdateValues)
      .where(eq(documents.id, id))
      .returning();
    return document || undefined;
  }

  async deleteDocument(id: string): Promise<boolean> {
    const result = await db.delete(documents).where(eq(documents.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Generation Job methods
  async getGenerationJob(id: string): Promise<GenerationJob | undefined> {
    const [job] = await db.select().from(generationJobs).where(eq(generationJobs.id, id));
    return job || undefined;
  }

  async getGenerationJobs(organizationId?: string): Promise<GenerationJob[]> {
    if (organizationId) {
      return await db
        .select()
        .from(generationJobs)
        .innerJoin(companyProfiles, eq(generationJobs.companyProfileId, companyProfiles.id))
        .where(eq(companyProfiles.organizationId, organizationId))
        .orderBy(desc(generationJobs.createdAt))
        .then(results => results.map(result => result.generation_jobs));
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
      .values([insertJob])
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
