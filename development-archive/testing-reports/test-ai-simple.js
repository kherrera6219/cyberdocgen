// Simple AI services test without external dependencies
import { readFileSync } from 'fs';

// Read environment from .env if it exists
let envVars = {};
try {
  const envFile = readFileSync('.env', 'utf8');
  envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key] = value;
    }
  });
} catch (e) {
  // .env file doesn't exist, use process.env
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || envVars.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || envVars.ANTHROPIC_API_KEY;

async function testOpenAI() {
  console.log("Testing OpenAI API...");
  
  if (!OPENAI_API_KEY) {
    console.log("OPENAI_API_KEY not found in environment");
    return false;
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'Say "OpenAI API test successful"' }],
        max_tokens: 50,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.log(`OpenAI API test failed: ${response.status} ${error}`);
      return false;
    }

    const data = await response.json();
    console.log("✅ OpenAI API test successful!");
    console.log("   Model: gpt-4o");
    console.log("   Response:", data.choices[0]?.message?.content);
    console.log("   Usage:", JSON.stringify(data.usage));
    return true;
  } catch (error) {
    console.log("OpenAI API test failed:", error.message);
    return false;
  }
}

async function testAnthropic() {
  console.log("\nTesting Anthropic Claude API...");
  
  if (!ANTHROPIC_API_KEY) {
    console.log("ANTHROPIC_API_KEY not found in environment");
    return false;
  }
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANTHROPIC_API_KEY}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 50,
        messages: [{ role: 'user', content: 'Say "Claude API test successful"' }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.log(`Claude API test failed: ${response.status} ${error}`);
      return false;
    }

    const data = await response.json();
    console.log("✅ Claude API test successful!");
    console.log("   Model: claude-sonnet-4-20250514");
    console.log("   Response:", data.content[0]?.text);
    console.log("   Usage:", JSON.stringify(data.usage));
    return true;
  } catch (error) {
    console.log("Claude API test failed:", error.message);
    return false;
  }
}

async function runTests() {
  console.log("AI Services Test Suite");
  console.log("==============================\n");
  
  const openaiResult = await testOpenAI();
  const claudeResult = await testAnthropic();
  
  console.log("\n==============================");
  console.log("Test Results:");
  console.log(`   OpenAI: ${openaiResult ? 'PASS' : 'FAIL'}`);
  console.log(`   Claude: ${claudeResult ? 'PASS' : 'FAIL'}`);
  console.log(`   Overall: ${openaiResult && claudeResult ? 'ALL SERVICES WORKING' : 'SOME ISSUES DETECTED'}`);
  
  if (openaiResult && claudeResult) {
    console.log("\nBoth AI services are configured correctly and working!");
    console.log("You can now use advanced AI features in your application.");
  } else {
    console.log("\nSome AI services need attention. Check the error messages above.");
  }
}

runTests().catch(error => {
  console.error("Test suite failed:", error);
  process.exit(1);
});