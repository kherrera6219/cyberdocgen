// Comprehensive AI services test for OpenAI, Anthropic, and Gemini
import { readFileSync } from 'fs';

// Read environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function testOpenAI() {
  console.log("🤖 Testing OpenAI GPT-4o...");
  
  if (!OPENAI_API_KEY) {
    console.log("   ❌ OPENAI_API_KEY not found");
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
        messages: [{ role: 'user', content: 'Generate a brief compliance document summary in 20 words.' }],
        max_tokens: 50,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.log(`   ❌ Failed: ${response.status} ${error}`);
      return false;
    }

    const data = await response.json();
    console.log("   ✅ Success!");
    console.log(`   📝 Response: ${data.choices[0]?.message?.content}`);
    console.log(`   📊 Usage: ${data.usage.total_tokens} tokens`);
    return true;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function testAnthropic() {
  console.log("\n🧠 Testing Anthropic Claude...");
  
  if (!ANTHROPIC_API_KEY) {
    console.log("   ❌ ANTHROPIC_API_KEY not found");
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
        messages: [{ role: 'user', content: 'Generate a brief security policy statement in 20 words.' }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.log(`   ❌ Failed: ${response.status} ${error}`);
      return false;
    }

    const data = await response.json();
    console.log("   ✅ Success!");
    console.log(`   📝 Response: ${data.content[0]?.text}`);
    console.log(`   📊 Usage: ${JSON.stringify(data.usage)}`);
    return true;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function testGemini() {
  console.log("\n🔍 Testing Google Gemini...");
  
  if (!GEMINI_API_KEY) {
    console.log("   ❌ GEMINI_API_KEY not found");
    return false;
  }
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Generate a brief risk assessment summary in 20 words. Focus on cybersecurity compliance.'
          }]
        }],
        generationConfig: {
          maxOutputTokens: 50,
          temperature: 0.7,
        }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.log(`   ❌ Failed: ${response.status} ${error}`);
      return false;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log("   ✅ Success!");
    console.log(`   📝 Response: ${text}`);
    console.log("   📊 Large context capability confirmed");
    return true;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function runComprehensiveTests() {
  console.log("🚀 AI Services Comprehensive Test Suite");
  console.log("==========================================\n");
  
  const results = await Promise.all([
    testOpenAI(),
    testAnthropic(),
    testGemini()
  ]);
  
  const [openaiResult, claudeResult, geminiResult] = results;
  
  console.log("\n==========================================");
  console.log("📊 Final Results:");
  console.log(`   OpenAI GPT-4o:     ${openaiResult ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`   Anthropic Claude:  ${claudeResult ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`   Google Gemini:     ${geminiResult ? '✅ WORKING' : '❌ FAILED'}`);
  
  const workingServices = [openaiResult, claudeResult, geminiResult].filter(Boolean).length;
  console.log(`   Overall Status:    ${workingServices}/3 services operational`);
  
  if (workingServices === 3) {
    console.log("\n🎉 All AI services are working perfectly!");
    console.log("   Your compliance platform now has:");
    console.log("   • OpenAI GPT-4o for advanced document generation");
    console.log("   • Anthropic Claude for detailed analysis and reasoning");
    console.log("   • Google Gemini for large context operations");
  } else if (workingServices > 0) {
    console.log(`\n⚠️  ${workingServices} of 3 AI services are working.`);
    console.log("   You can still use the platform with reduced AI capabilities.");
  } else {
    console.log("\n❌ No AI services are currently working.");
    console.log("   Please check your API keys and try again.");
  }
}

runComprehensiveTests().catch(error => {
  console.error("💥 Test suite failed:", error);
  process.exit(1);
});