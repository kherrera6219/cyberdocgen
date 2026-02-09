### **Phase 1: Gemini 3 Pro Integration & Local Preparation**

*   [ ] **1.1: Obtain Gemini API Key:**
    *   Go to Google AI Studio and get your API key.
*   [ ] **1.2: Update Environment Variables:**
    *   Add your new Gemini API key to your existing `.env` file and later to Firebase's secret manager.
    *   `GEMINI_API_KEY=your-new-api-key`
*   [ ] **1.3: Create Gemini Service File:**
    *   Create a new file `server/services/gemini.ts` to handle communication with the Gemini API.
*   [ ] **1.4: Integrate Gemini into the AI Orchestrator:**
    *   Update `server/services/aiOrchestrator.ts` to include Gemini as a model option.
    *   Add logic to select and use Gemini for specific tasks.
    *   Add a new circuit breaker and health check for the Gemini service.
*   [ ] **1.5: Add Gemini to Frontend:**
    *   Update `client/src/pages/ai-assistant.tsx` to add "Gemini 3 Pro" to the agent selection dropdown.
*   [ ] **1.6: Local Testing:**
    *   Run the application locally (`npm run dev`) and thoroughly test the new Gemini integration in the AI Assistant.

### **Phase 2: Firebase Project Setup**

*   [ ] **2.1: Create Firebase Project:**
    *   Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
*   [ ] **2.2: Install Firebase CLI:**
    *   Run `npm install -g firebase-tools` on your local machine.
*   [ ] **2.3: Login and Initialize Firebase:**
    *   Run `firebase login`.
    *   Run `firebase init` in your project root.
    *   Select **Hosting** and **Functions**.
    *   Choose your newly created Firebase project.
    *   Use `dist` as your public directory for hosting.
    *   Configure as a single-page app (rewrite all urls to /index.html).
    *   Select `TypeScript` for Cloud Functions.
*   [ ] **2.4: Configure Firebase Environment Secrets:**
    *   Securely add your API keys to the Firebase environment. For each key, run:
    *   `firebase functions:secrets:set SECRET_NAME` and enter the value when prompted.
        *   `OPENAI_API_KEY`
        *   `ANTHROPIC_API_KEY`
        *   `GEMINI_API_KEY`

### **Phase 3: Codebase Adaptation for Firebase**

*   [ ] **3.1: Update Backend for Cloud Functions:**
    *   Modify `server/index.ts` to export the Express app as a Cloud Function instead of starting a server with `app.listen()`.
    *   Install necessary Firebase packages: `npm install firebase-admin firebase-functions`
*   [ ] **3.2: Configure `firebase.json`:**
    *   Ensure `firebase.json` is configured to point hosting to the client's build output (`dist`) and to correctly route API calls to your cloud function.
*   [ ] **3.3: Build the Frontend:**
    *   Run the production build command: `npm run build`.

### **Phase 4: Deployment & Publication**

*   [ ] **4.1: Deploy to Firebase:**
    *   Run `firebase deploy` to deploy both your frontend to Hosting and your backend to Cloud Functions.
*   [ ] **4.2: Final Publication Checklist:**
    *   **Privacy Policy:** Ensure you have a public privacy policy hosted on an HTTPS URL. Link to it from your application.
    *   **Custom Domain:** In the Firebase Hosting console, add a custom domain for a professional URL.
    *   **Testing:** Perform end-to-end testing on the live Firebase URL.
    *   **Monitoring:** Use the Firebase console to monitor function logs, hosting usage, and check for any errors.
