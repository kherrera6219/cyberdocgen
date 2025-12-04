#!/usr/bin/env tsx

/**
 * SBOM (Software Bill of Materials) Generation Script - Phase 4
 * Generates comprehensive SBOM in CycloneDX and SPDX formats
 * for supply chain security and vulnerability tracking
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import crypto from "crypto";

interface Package {
  name: string;
  version: string;
  license?: string;
  repository?: string;
  description?: string;
  dependencies?: Record<string, string>;
}

interface SBOMMetadata {
  timestamp: string;
  tools: Array<{ name: string; version: string }>;
  component: {
    name: string;
    version: string;
    type: string;
  };
}

interface VulnerabilitySummary {
  critical: number;
  high: number;
  moderate: number;
  low: number;
  total: number;
}

class SBOMGenerator {
  private projectRoot: string;
  private outputDir: string;

  constructor() {
    this.projectRoot = process.cwd();
    this.outputDir = path.join(this.projectRoot, "sbom");
  }

  /**
   * Generate complete SBOM
   */
  async generate(): Promise<void> {
    console.log("🔍 SBOM Generation Starting...");
    console.log("=====================================\n");

    try {
      // Create output directory
      this.ensureOutputDir();

      // 1. Generate package inventory
      console.log("📦 Step 1: Analyzing dependencies...");
      const packages = await this.analyzePackages();
      console.log(`   Found ${packages.length} packages\n`);

      // 2. Generate CycloneDX format
      console.log("📋 Step 2: Generating CycloneDX SBOM...");
      const cycloneDX = this.generateCycloneDX(packages);
      this.writeSBOM("sbom-cyclonedx.json", cycloneDX);
      console.log("   ✓ CycloneDX SBOM generated\n");

      // 3. Generate SPDX format
      console.log("📋 Step 3: Generating SPDX SBOM...");
      const spdx = this.generateSPDX(packages);
      this.writeSBOM("sbom-spdx.json", spdx);
      console.log("   ✓ SPDX SBOM generated\n");

      // 4. Generate human-readable summary
      console.log("📊 Step 4: Generating summary report...");
      const summary = this.generateSummary(packages);
      this.writeSBOM("sbom-summary.md", summary);
      console.log("   ✓ Summary report generated\n");

      // 5. Check for known vulnerabilities
      console.log("🔒 Step 5: Checking for vulnerabilities...");
      const vulnerabilities = await this.checkVulnerabilities();
      this.writeSBOM("sbom-vulnerabilities.json", JSON.stringify(vulnerabilities, null, 2));
      console.log(`   Found ${vulnerabilities.total} known vulnerabilities\n`);

      // 6. Generate hash for verification
      console.log("🔐 Step 6: Generating verification hashes...");
      this.generateHashes();
      console.log("   ✓ Hashes generated\n");

      // Final summary
      console.log("=====================================");
      console.log("✅ SBOM Generation Complete!\n");
      console.log("📁 Output directory: " + this.outputDir);
      console.log("\nGenerated files:");
      console.log("  - sbom-cyclonedx.json (CycloneDX format)");
      console.log("  - sbom-spdx.json (SPDX format)");
      console.log("  - sbom-summary.md (Human-readable)");
      console.log("  - sbom-vulnerabilities.json (Vulnerability report)");
      console.log("  - sbom.sha256 (Verification hashes)");

      if (vulnerabilities.critical > 0 || vulnerabilities.high > 0) {
        console.log("\n⚠️  WARNING: Critical or high-severity vulnerabilities found!");
        console.log(`   Critical: ${vulnerabilities.critical}`);
        console.log(`   High: ${vulnerabilities.high}`);
        console.log("   Run 'npm audit fix' to address them.");
      }

    } catch (error: any) {
      console.error("❌ SBOM generation failed:", error.message);
      process.exit(1);
    }
  }

  /**
   * Analyze package dependencies
   */
  private async analyzePackages(): Promise<Package[]> {
    const packageJsonPath = path.join(this.projectRoot, "package.json");
    const packageLockPath = path.join(this.projectRoot, "package-lock.json");

    if (!fs.existsSync(packageJsonPath)) {
      throw new Error("package.json not found");
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    const packages: Package[] = [];

    // Add root package
    packages.push({
      name: packageJson.name || "cyberdocgen",
      version: packageJson.version || "1.0.0",
      license: packageJson.license,
      repository: packageJson.repository?.url,
      description: packageJson.description,
      dependencies: packageJson.dependencies,
    });

    // Parse package-lock.json for full dependency tree
    if (fs.existsSync(packageLockPath)) {
      const packageLock = JSON.parse(fs.readFileSync(packageLockPath, "utf-8"));

      if (packageLock.packages) {
        for (const [pkgPath, pkgInfo] of Object.entries(packageLock.packages)) {
          if (pkgPath === "") continue; // Skip root

          const pkgName = pkgPath.replace(/^node_modules\//, "");
          const pkg = pkgInfo as any;

          packages.push({
            name: pkgName,
            version: pkg.version,
            license: pkg.license,
            repository: pkg.repository?.url,
            description: pkg.description,
          });
        }
      }
    }

    return packages;
  }

  /**
   * Generate CycloneDX format SBOM
   */
  private generateCycloneDX(packages: Package[]): string {
    const metadata: SBOMMetadata = {
      timestamp: new Date().toISOString(),
      tools: [
        {
          name: "cyberdocgen-sbom-generator",
          version: "1.0.0",
        },
      ],
      component: {
        name: packages[0].name,
        version: packages[0].version,
        type: "application",
      },
    };

    const components = packages.slice(1).map((pkg) => ({
      type: "library",
      name: pkg.name,
      version: pkg.version,
      licenses: pkg.license
        ? [{ license: { id: pkg.license } }]
        : undefined,
      purl: `pkg:npm/${pkg.name}@${pkg.version}`,
    }));

    const cycloneDX = {
      bomFormat: "CycloneDX",
      specVersion: "1.4",
      serialNumber: `urn:uuid:${crypto.randomUUID()}`,
      version: 1,
      metadata,
      components,
    };

    return JSON.stringify(cycloneDX, null, 2);
  }

  /**
   * Generate SPDX format SBOM
   */
  private generateSPDX(packages: Package[]): string {
    const spdx = {
      spdxVersion: "SPDX-2.3",
      dataLicense: "CC0-1.0",
      SPDXID: "SPDXRef-DOCUMENT",
      name: `${packages[0].name}-${packages[0].version}`,
      documentNamespace: `https://github.com/kherrera6219/cyberdocgen/sbom/${Date.now()}`,
      creationInfo: {
        created: new Date().toISOString(),
        creators: ["Tool: cyberdocgen-sbom-generator-1.0.0"],
        licenseListVersion: "3.20",
      },
      packages: packages.map((pkg, idx) => ({
        SPDXID: `SPDXRef-Package-${idx}`,
        name: pkg.name,
        versionInfo: pkg.version,
        downloadLocation: pkg.repository || "NOASSERTION",
        filesAnalyzed: false,
        licenseConcluded: pkg.license || "NOASSERTION",
        licenseDeclared: pkg.license || "NOASSERTION",
        copyrightText: "NOASSERTION",
      })),
      relationships: [
        {
          spdxElementId: "SPDXRef-DOCUMENT",
          relationshipType: "DESCRIBES",
          relatedSpdxElement: "SPDXRef-Package-0",
        },
      ],
    };

    return JSON.stringify(spdx, null, 2);
  }

  /**
   * Generate human-readable summary
   */
  private generateSummary(packages: Package[]): string {
    const rootPkg = packages[0];
    const dependencies = packages.slice(1);

    let summary = `# Software Bill of Materials (SBOM)
## ${rootPkg.name} v${rootPkg.version}

**Generated:** ${new Date().toISOString()}

---

## Application Information

- **Name:** ${rootPkg.name}
- **Version:** ${rootPkg.version}
- **License:** ${rootPkg.license || "Not specified"}
- **Description:** ${rootPkg.description || "Not specified"}

## Dependency Summary

- **Total Dependencies:** ${dependencies.length}
- **Direct Dependencies:** ${Object.keys(rootPkg.dependencies || {}).length}

## License Distribution

`;

    // Count licenses
    const licenseCounts: Record<string, number> = {};
    dependencies.forEach((pkg) => {
      const license = pkg.license || "Unknown";
      licenseCounts[license] = (licenseCounts[license] || 0) + 1;
    });

    Object.entries(licenseCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([license, count]) => {
        summary += `- ${license}: ${count} packages\n`;
      });

    summary += `\n## Top 20 Dependencies\n\n`;
    summary += `| Package | Version | License |\n`;
    summary += `|---------|---------|----------|\n`;

    dependencies.slice(0, 20).forEach((pkg) => {
      summary += `| ${pkg.name} | ${pkg.version} | ${pkg.license || "N/A"} |\n`;
    });

    summary += `\n## Supply Chain Security

This SBOM provides a complete inventory of all software components
in this application. It can be used for:

- Vulnerability tracking and remediation
- License compliance verification
- Supply chain risk assessment
- Dependency auditing

For the complete machine-readable SBOM, see:
- \`sbom-cyclonedx.json\` (CycloneDX format)
- \`sbom-spdx.json\` (SPDX format)

---

*Generated by CyberDocGen SBOM Generator*
`;

    return summary;
  }

  /**
   * Check for known vulnerabilities
   */
  private async checkVulnerabilities(): Promise<VulnerabilitySummary> {
    try {
      // Run npm audit and parse results
      const auditOutput = execSync("npm audit --json", {
        cwd: this.projectRoot,
        encoding: "utf-8",
      });

      const audit = JSON.parse(auditOutput);

      return {
        critical: audit.metadata?.vulnerabilities?.critical || 0,
        high: audit.metadata?.vulnerabilities?.high || 0,
        moderate: audit.metadata?.vulnerabilities?.moderate || 0,
        low: audit.metadata?.vulnerabilities?.low || 0,
        total: audit.metadata?.vulnerabilities?.total || 0,
      };
    } catch (error: any) {
      // npm audit returns non-zero exit code if vulnerabilities found
      // Try to parse the output anyway
      if (error.stdout) {
        try {
          const audit = JSON.parse(error.stdout);
          return {
            critical: audit.metadata?.vulnerabilities?.critical || 0,
            high: audit.metadata?.vulnerabilities?.high || 0,
            moderate: audit.metadata?.vulnerabilities?.moderate || 0,
            low: audit.metadata?.vulnerabilities?.low || 0,
            total: audit.metadata?.vulnerabilities?.total || 0,
          };
        } catch {
          // Ignore parse error
        }
      }

      return {
        critical: 0,
        high: 0,
        moderate: 0,
        low: 0,
        total: 0,
      };
    }
  }

  /**
   * Generate verification hashes
   */
  private generateHashes(): void {
    const files = [
      "sbom-cyclonedx.json",
      "sbom-spdx.json",
      "sbom-summary.md",
      "sbom-vulnerabilities.json",
    ];

    let hashContent = "# SBOM Verification Hashes (SHA-256)\n\n";

    files.forEach((file) => {
      const filePath = path.join(this.outputDir, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath);
        const hash = crypto.createHash("sha256").update(content).digest("hex");
        hashContent += `${hash}  ${file}\n`;
      }
    });

    fs.writeFileSync(path.join(this.outputDir, "sbom.sha256"), hashContent);
  }

  /**
   * Ensure output directory exists
   */
  private ensureOutputDir(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Write SBOM file
   */
  private writeSBOM(filename: string, content: string): void {
    const filePath = path.join(this.outputDir, filename);
    fs.writeFileSync(filePath, content, "utf-8");
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new SBOMGenerator();
  generator.generate().catch((error) => {
    console.error("SBOM generation failed:", error);
    process.exit(1);
  });
}

export { SBOMGenerator };
