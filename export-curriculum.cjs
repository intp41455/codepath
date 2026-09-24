const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'../dist'),context={};context.window=context;vm.createContext(context);
for(const f of ['curriculum.js','foundations.js','backend.js','ai-lessons.js','mastery.js','projects.js','new-courses.js','new-projects.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),context);
process.stdout.write(JSON.stringify({lessons:context.LESSONS}));
