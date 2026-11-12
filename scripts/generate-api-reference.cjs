// Generate route inventory from TypeScript decorators. Swagger remains the request-schema source.
const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
const decorators = node => (ts.canHaveDecorators(node) ? ts.getDecorators(node) : []) || [];
const calls = node => decorators(node).map(item => item.expression).filter(ts.isCallExpression);
const name = call => call.expression.getText();
const literal = node => node && ts.isStringLiteral(node) ? node.text : '';
const roleText = node => calls(node).filter(call => name(call) === 'UseGuards').map(call => call.arguments.map(arg => ts.isCallExpression(arg) ? arg.arguments.map(literal).join(', ') : arg.getText()).join(', ')).join(', ');
const routes = [];
for (const file of walk('src').filter(file => file.endsWith('.controller.ts'))) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  for (const cls of source.statements.filter(ts.isClassDeclaration)) {
    const controller = calls(cls).find(call => name(call) === 'Controller');
    if (!controller) continue;
    const prefix = literal(controller.arguments[0]);
    for (const method of cls.members.filter(ts.isMethodDeclaration)) {
      const route = calls(method).find(call => ['Get','Post','Put','Patch','Delete'].includes(name(call)));
      if (!route) continue;
      const endpoint = ['/api/v1', prefix, literal(route.arguments[0])].join('/').replace(/\/+/g, '/').replace(/\/$/, '');
      const roles = [roleText(cls), roleText(method)].filter(Boolean).join('; ') || 'Public';
      const bodyParam = method.parameters.find(param => calls(param).some(call => name(call) === 'Body'));
      routes.push({ method: name(route).toUpperCase(), endpoint: file === 'src'+path.sep+'app.controller.ts' ? '/' : endpoint, roles, body: bodyParam?.type?.getText(source) || '—', file: file.replaceAll('\\','/') });
    }
  }
}
const header = '# API route reference\n\nGenerated with `npm run docs:api`. Base path: `/api/v1`. Request examples, validation and multipart file names are in Swagger at `/api/docs`; import `/api/docs-json` directly into Postman.\n\nFor `Public` routes no login is required. Other rows list allowed account roles. IDs in URLs are MongoDB IDs. Existing `businesswoner` spelling is preserved for frontend compatibility.\n\n| Method | Path | Access | Body DTO |\n|---|---|---|---|\n';
fs.writeFileSync('docs/api-reference.md', header + routes.map(r => `| ${r.method} | \`${r.endpoint}\` | ${r.roles} | ${r.body.replaceAll('|','/')} |`).join('\n')+'\n');
fs.writeFileSync('docs/api-routes.json',JSON.stringify(routes,null,2)+'\n');
const folders = new Map();
for (const r of routes) {
  const group = r.file.split('/').at(-2);
  if (!folders.has(group)) folders.set(group, []);
  const url = '{{baseUrl}}'+r.endpoint.replace(/:([a-zA-Z][a-zA-Z0-9]*)/g, '{{$1}}');
  folders.get(group).push({ name: r.method+' '+r.endpoint, request: { method: r.method, header: [], ...(r.roles === 'Public' ? { auth: { type: 'noauth' } } : {}), url, description: `Access: ${r.roles}. Body: ${r.body}. Use Swagger request schema at /api/docs. Mutations require real input; this collection is an inventory, not a blind collection runner.` } });
}
fs.writeFileSync('docs/backend.postman_collection.json', JSON.stringify({ info: { name: 'Bookkeepers Marketplace API', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' }, auth: { type: 'bearer', bearer: [{ key: 'token', value: '{{accessToken}}', type: 'string' }] }, variable: [{ key: 'baseUrl', value: 'http://localhost:3000' }, { key: 'accessToken', value: '' }], item: [...folders].map(([name,item])=>({name,item})) }, null,2)+'\n');
console.log(`Generated ${routes.length} API routes and Postman inventory.`);
