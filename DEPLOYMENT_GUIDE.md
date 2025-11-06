# 🚀 Deployment & GitHub Upload Guide

This guide will help you upload this project to GitHub and deploy it online.

## 📦 Part 1: Upload to GitHub

### Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right → "New repository"
3. Fill in the details:
   - **Repository name**: `collaborative-canvas` (or your choice)
   - **Description**: "Real-time collaborative drawing canvas with WebSocket"
   - **Visibility**: Choose Public or Private
   - **DO NOT** initialize with README (we already have one)
4. Click "Create repository"

### Step 2: Initialize Git in Your Project

Open your terminal in the project directory and run:

```bash
# Navigate to project directory
cd collaborative-canvas

# Initialize git repository
git init

# Add all files to staging
git add .

# Create first commit
git commit -m "Initial commit: Real-time collaborative canvas"

# Add GitHub remote (replace YOUR_USERNAME and REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Verify Upload

1. Refresh your GitHub repository page
2. You should see all your files uploaded
3. GitHub will automatically display your README.md

---

## 🌐 Part 2: Deploy Online

### Option A: Deploy to Render (Recommended - Free Tier)

Render offers free hosting perfect for this project.

#### Steps:

1. **Sign up for Render**
   - Go to [render.com](https://render.com)
   - Sign up with your GitHub account

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your `collaborative-canvas` repository

3. **Configure Service**
   ```
   Name: collaborative-canvas
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for build to complete (~2 minutes)
   - Your app will be live at: `https://your-app-name.onrender.com`

5. **Free Tier Notes**:
   - Service spins down after 15 minutes of inactivity
   - First request after inactivity takes ~30 seconds
   - Perfect for demos and testing

#### Cost: FREE ✅

---

### Option B: Deploy to Heroku

#### Prerequisites:
- Heroku account (sign up at [heroku.com](https://heroku.com))
- Heroku CLI installed

#### Steps:

1. **Install Heroku CLI**
   ```bash
   # macOS
   brew tap heroku/brew && brew install heroku
   
   # Windows
   # Download from https://devcenter.heroku.com/articles/heroku-cli
   
   # Linux
   curl https://cli-assets.heroku.com/install.sh | sh
   ```

2. **Login to Heroku**
   ```bash
   heroku login
   ```

3. **Create Heroku App**
   ```bash
   cd collaborative-canvas
   heroku create your-app-name
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

5. **Open App**
   ```bash
   heroku open
   ```

Your app will be at: `https://your-app-name.herokuapp.com`

#### Cost: 
- **Free Tier (Eco)**: $5/month (includes 1000 hours)
- **Basic**: $7/month

---

### Option C: Deploy to Vercel

#### Steps:

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   cd collaborative-canvas
   vercel
   ```

4. **Follow Prompts**
   - Set up and deploy? Yes
   - Which scope? Your account
   - Link to existing project? No
   - Project name? collaborative-canvas
   - Directory? ./
   - Override settings? No

5. **Production Deploy**
   ```bash
   vercel --prod
   ```

Your app will be at: `https://your-app-name.vercel.app`

**Note**: Vercel works best with serverless functions. For WebSocket, Render or Heroku are better choices.

#### Cost: FREE ✅

---

### Option D: Deploy to Railway

Railway is another great option with WebSocket support.

#### Steps:

1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your `collaborative-canvas` repository
6. Railway auto-detects Node.js and deploys
7. Get your URL from the deployment settings

#### Cost:
- **Free Tier**: $5 credit/month (enough for small projects)
- **Hobby**: $20/month

---

## 🔧 Environment Configuration

If deploying to production, create a `.env` file:

```env
PORT=3000
NODE_ENV=production
```

Most platforms automatically set the `PORT` variable, so you may not need this.

---

## 📝 Post-Deployment Checklist

After deploying, verify:

- [ ] Application loads successfully
- [ ] Multiple users can connect
- [ ] Drawing synchronizes in real-time
- [ ] Undo/redo works across users
- [ ] No console errors
- [ ] Performance metrics display correctly

---

## 🧪 Testing Your Deployment

1. **Open your deployed URL** in a browser
2. **Open the same URL** in multiple tabs/browsers
3. **Draw in one tab** - verify it appears in others
4. **Test undo/redo** across tabs
5. **Check performance** metrics (FPS, latency)

---

## 🐛 Common Deployment Issues

### Issue 1: "Application Error" or 503

**Cause**: Server not starting
**Solution**: 
```bash
# Check logs
heroku logs --tail  # For Heroku
# or check Render/Railway dashboard logs

# Common fix: Ensure start script in package.json
npm start should run "node server/server.js"
```

### Issue 2: WebSocket Connection Failed

**Cause**: HTTPS/WSS protocol mismatch
**Solution**: Most platforms auto-handle this, but verify Socket.io connects to the correct protocol

### Issue 3: Port Binding Error

**Cause**: Hardcoded port
**Solution**: Use environment variable
```javascript
const PORT = process.env.PORT || 3000;
```

### Issue 4: Build Failed

**Cause**: Missing dependencies
**Solution**: 
```bash
# Ensure all dependencies in package.json
npm install
git add package.json package-lock.json
git commit -m "Update dependencies"
git push
```

---

## 📊 Monitoring Your App

### Render
- Dashboard shows: CPU, Memory, Bandwidth usage
- Logs available in real-time
- Auto-deploy on git push

### Heroku
```bash
# View logs
heroku logs --tail

# Check dyno status
heroku ps

# Restart app
heroku restart
```

---

## 🎯 Submission Checklist

Before submitting your assignment:

- [ ] Code pushed to GitHub
- [ ] README.md displays properly
- [ ] ARCHITECTURE.md is complete
- [ ] Application deployed and accessible
- [ ] Demo link works in incognito/private window
- [ ] Multiple users tested successfully
- [ ] GitHub repository has clear commit history
- [ ] .gitignore prevents node_modules upload

---

## 📧 Submission Format

Email should include:

**Subject**: Frontend Assignment - Collaborative Canvas Submission

**Body**:
```
Name: [Your Name]
Position: [Position Applied For]

GitHub Repository: https://github.com/YOUR_USERNAME/collaborative-canvas
Live Demo: https://your-app.onrender.com

Time Spent: ~8-10 hours

Key Features Implemented:
- Real-time collaborative drawing
- WebSocket communication
- Global undo/redo
- User presence indicators
- Performance monitoring
- Mobile touch support

Known Limitations:
[List any limitations mentioned in README]

Additional Notes:
[Any additional information]
```

---

## 🎉 You're Done!

Your collaborative canvas is now:
- ✅ Version controlled on GitHub
- ✅ Deployed and accessible online
- ✅ Ready for submission
- ✅ Shareable with anyone

**Test your submission link in an incognito window to ensure it works for evaluators!**

---

## 📚 Additional Resources

- [Socket.io Documentation](https://socket.io/docs/v4/)
- [Canvas API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [Heroku Node.js Guide](https://devcenter.heroku.com/articles/deploying-nodejs)
- [Render Documentation](https://render.com/docs)

Good luck with your submission! 🚀
