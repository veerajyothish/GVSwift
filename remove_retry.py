import re

def remove_retry(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except:
        return
    
    # Remove import
    content = re.sub(r'import \{ withRetry \} from "@/lib/retry";\n', '', content)
    
    # Remove withRetry wrappers
    content = re.sub(r'await withRetry\(\(\) =>\s*([\s\S]*?)\n\s*\)', r'await \1', content)
    content = re.sub(r'await withRetry\(\s*async \(\) =>\s*([\s\S]*?)\n\s*\)', r'await \1', content)
    content = re.sub(r'withRetry\(\(\) =>\s*([\s\S]*?)\n\s*\)', r'\1', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

files = [
    'src/features/notifications/service.tsx',
    'src/app/api/search/route.ts',
    'src/app/api/v1/admin/products/upload/route.ts',
    'src/app/(public)/page.tsx',
    'src/app/(public)/products/page.tsx',
    'src/lib/inngest/functions.tsx'
]

for file in files:
    remove_retry(file)
