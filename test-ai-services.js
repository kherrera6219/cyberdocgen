import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { config } from 'dotenv';

// Load environment variables
config();

async function testOpenAI() {
  console.log("🔍 Testing OpenAI API...");
  
  if (!process.env.OPENAI_API_KEY) {
    console.log("❌ OPENAI_API_KEY not found");
    return false;
  }
  
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: "Say 'OpenAI API test successful'" }],
      max_tokens: 50,
    });

    console.log("✅ OpenAI API test successful!");
    console.log("   Model:", "gpt-4o");
    console.log("   Response:", response.choices[0]?.message?.content);
    console.log("   Usage:", response.usage);
    return true;
  } catch (error) {
    console.log("❌ OpenAI API test failed:", error.message);
    console.log("   Error code:", error.code || "unknown");
    return false;
  }
}

async function testAnthropic() {
  console.log("\n🔍 Testing Anthropic Claude API...");
  
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log("❌ ANTHROPIC_API_KEY not found");
    return false;
  }
  
  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 50,
      messages: [{ role: "user", content: "Say 'Claude API test successful'" }],
    });

    console.log("✅ Claude API test successful!");
    console.log("   Model:", "claude-sonnet-4-20250514");
    console.log("   Response:", response.content[0]?.text);
    console.log("   Usage:", response.usage);
    return true;
  } catch (error) {
    console.log("❌ Claude API test failed:", error.message);
    console.log("   Error status:", error.status || "unknown");
    return false;
  }
}

async function runTests() {
  console.log("🧪 AI Services Test Suite\n");
  console.log("==============================");
  
  const openaiResult = await testOpenAI();
  const claudeResult = await testAnthropic();
  
  console.log("\n==============================");
  console.log("📊 Test Results:");
  console.log(`   OpenAI: ${openaiResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Claude: ${claudeResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Overall: ${openaiResult && claudeResult ? '✅ ALL SERVICES WORKING' : '⚠️  SOME ISSUES DETECTED'}`);
  
  if (openaiResult && claudeResult) {
    console.log("\n🎉 Both AI services are configured correctly and working!");
    console.log("   You can now use advanced AI features in your application.");
  } else {
    console.log("\n⚠️  Some AI services need attention. Check the error messages above.");
  }
}

// Run the tests
runTests().catch(error => {
  console.error("💥 Test suite failed:", error);
  process.exit(1);
});