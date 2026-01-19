---
description: Build and push to git - runs npm build then commits and pushes all changes
---
// turbo-all

1. Stop any running dev server if needed

2. Run the build
```bash
cd /Users/second/Downloads/bimon-bgmi && npm run build
```

3. If build succeeds, stage all changes
```bash
cd /Users/second/Downloads/bimon-bgmi && git add -A
```

4. Commit with a descriptive message based on recent changes
```bash
cd /Users/second/Downloads/bimon-bgmi && git commit -m "<descriptive commit message>"
```

5. Push to remote
```bash
cd /Users/second/Downloads/bimon-bgmi && git push
```
