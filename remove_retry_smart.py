import os

def remove_with_retry(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        return

    # Remove import
    import_stmt = 'import { withRetry } from "@/lib/retry";\n'
    import_stmt_2 = "import { withRetry } from '@/lib/retry';\n"
    content = content.replace(import_stmt, '').replace(import_stmt_2, '')

    while 'withRetry(' in content:
        idx = content.find('withRetry(')
        # Find matching parenthesis
        open_parens = 0
        match_idx = -1
        for i in range(idx + 9, len(content)):
            if content[i] == '(':
                open_parens += 1
            elif content[i] == ')':
                open_parens -= 1
                if open_parens == 0:
                    match_idx = i
                    break
        
        if match_idx != -1:
            inner = content[idx+10:match_idx].strip()
            if inner.startswith('() =>'):
                inner = inner[5:].strip()
            elif inner.startswith('async () =>'):
                inner = inner[11:].strip()
                
            prefix = content[:idx]
            content = prefix + inner + content[match_idx+1:]
        else:
            break

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

files = [
    'src/features/catalog/repository.ts',
    'src/features/checkout/service.ts',
    'src/features/notifications/service.tsx',
    'src/app/api/search/route.ts',
    'src/app/api/v1/admin/products/upload/route.ts',
    'src/app/(public)/page.tsx',
    'src/app/(public)/products/page.tsx',
    'src/lib/inngest/functions.tsx'
]

for file in files:
    remove_with_retry(file)
