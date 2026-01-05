@echo off
echo 🚀 Deploying to Fixed Production URL...
echo 📍 Target URL: https://frontend-iota-six-72.vercel.app

cd frontend

echo 📝 Committing changes...
git add .
git commit -m "Deploy to fixed production URL - %date% %time%"

echo 📤 Pushing to repository...
git push origin main

echo 🔧 Deploying to Vercel...
vercel --prod --yes

echo ✅ Deployment completed!
echo 🌐 Production URL: https://frontend-iota-six-72.vercel.app

cd ..

echo 🎉 Fixed production deployment successful!
pause