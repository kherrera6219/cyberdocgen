#!/usr/bin/env node

// Comprehensive AI Endpoints Test Suite
// Tests all AI-powered functions in the ComplianceAI application

const baseUrl = 'http://localhost:5000';

const testCases = [
  {
    name: 'Document Generation (GPT-5)',
    endpoint: '/api/generate-document',
    data: {
      framework: 'ISO27001',
      companyProfile: {
        name: 'TechCorp Solutions',
        industry: 'Technology',
        size: 'Medium'
      },
      documentType: 'Information Security Policy'
    }
  },
  {
    name: 'Risk Assessment (Claude Opus 4.1)',
    endpoint: '/api/risk-assessment',
    data: {
      companyProfile: {
        name: 'HealthTech Inc',
        industry: 'Healthcare',
        assets: ['patient_data', 'medical_devices', 'cloud_infrastructure'],
        threats: ['data_breach', 'ransomware', 'insider_threat']
      }
    }
  },
  {
    name: 'Compliance Analysis (Gemini 2.5 Pro)',
    endpoint: '/api/compliance-analysis',
    data: {
      framework: 'SOC2',
      currentControls: ['access_control', 'encryption', 'monitoring'],
      requirements: ['data_protection', 'incident_response', 'backup_procedures']
    }
  },
  {
    name: 'Document Quality Analysis (Claude Opus 4.1)',
    endpoint: '/api/analyze-document-quality',
    data: {
      content: `# Information Security Policy

## Purpose
This policy establishes information security requirements.

## Scope  
Applies to all employees and systems.

## Requirements
- Use strong passwords
- Encrypt sensitive data
- Report incidents immediately
- Follow access control procedures

## Compliance
Regular audits will ensure compliance.`,
      framework: 'ISO27001'
    }
  },
  {
    name: 'Compliance Chat Assistant (GPT-5)',
    endpoint: '/api/compliance-chat',
    data: {
      question: 'What are the key requirements for SOC 2 Type 2 compliance?',
      context: 'Small technology startup with cloud infrastructure'
    }
  },
  {
    name: 'Multi-Model Generation (Intelligent Selection)',
    endpoint: '/api/generate-multi-model',
    data: {
      framework: 'NIST',
      documentType: 'Risk Assessment Report',
      companyProfile: {
        name: 'FinTech Corp',
        industry: 'Financial Services'
      },
      preferredModel: 'claude'
    }
  }
];

async function testEndpoint(testCase) {
  const startTime = Date.now();
  
  try {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log(`📍 Endpoint: ${testCase.endpoint}`);
    
    const response = await fetch(`${baseUrl}${testCase.endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCase.data),
    });

    const responseTime = Date.now() - startTime;
    const data = await response.json();

    if (response.ok && data.success !== false) {
      console.log(`✅ SUCCESS (${responseTime}ms)`);
      
      // Log key response details
      if (data.model) console.log(`   🤖 Model: ${data.model}`);
      if (data.modelUsed) console.log(`   🤖 Model: ${data.modelUsed}`);
      if (data.qualityScore) console.log(`   📊 Quality Score: ${data.qualityScore}/100`);
      if (data.usage) console.log(`   📈 Tokens: ${data.usage.total_tokens || 'N/A'}`);
      
      // Show preview of response content
      if (data.content) {
        const preview = data.content.substring(0, 100).replace(/\n/g, ' ') + '...';
        console.log(`   📝 Preview: ${preview}`);
      }
      if (data.riskAssessment) {
        const preview = data.riskAssessment.substring(0, 100).replace(/\n/g, ' ') + '...';
        console.log(`   ⚠️  Risk Analysis: ${preview}`);
      }
      if (data.answer) {
        const preview = data.answer.substring(0, 100).replace(/\n/g, ' ') + '...';
        console.log(`   💬 Answer: ${preview}`);
      }
      if (data.complianceAnalysis) {
        const preview = data.complianceAnalysis.substring(0, 100).replace(/\n/g, ' ') + '...';
        console.log(`   🔍 Analysis: ${preview}`);
      }
      
      return { success: true, time: responseTime, model: data.model || data.modelUsed };
    } else {
      console.log(`❌ FAILED (${responseTime}ms)`);
      console.log(`   Error: ${data.error || response.statusText}`);
      return { success: false, time: responseTime, error: data.error || response.statusText };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.log(`💥 NETWORK ERROR (${responseTime}ms)`);
    console.log(`   ${error.message}`);
    return { success: false, time: responseTime, error: error.message };
  }
}

async function runAllTests() {
  console.log('🚀 ComplianceAI - AI Functions Test Suite');
  console.log('==========================================');
  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log(`🎯 Target: ${baseUrl}`);
  
  const results = {
    total: testCases.length,
    passed: 0,
    failed: 0,
    totalTime: 0,
    models: new Set(),
  };
  
  for (const testCase of testCases) {
    const result = await testEndpoint(testCase);
    results.totalTime += result.time;
    
    if (result.success) {
      results.passed++;
      if (result.model) results.models.add(result.model);
    } else {
      results.failed++;
    }
    
    // Brief pause between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Final summary
  console.log('\n==========================================');
  console.log('📊 FINAL RESULTS:');
  console.log(`   ✅ Passed: ${results.passed}/${results.total}`);
  console.log(`   ❌ Failed: ${results.failed}/${results.total}`);
  console.log(`   ⏱️  Total Time: ${results.totalTime}ms`);
  console.log(`   🤖 Models Used: ${Array.from(results.models).join(', ')}`);
  console.log(`   📈 Success Rate: ${Math.round((results.passed / results.total) * 100)}%`);
  
  if (results.passed === results.total) {
    console.log('\n🎉 ALL AI SERVICES ARE WORKING PERFECTLY!');
  } else if (results.passed > 0) {
    console.log('\n⚠️  Some services working, check failed tests above.');
  } else {
    console.log('\n💥 NO SERVICES WORKING - check API keys and connectivity.');
  }
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run the test suite
runAllTests().catch(console.error);