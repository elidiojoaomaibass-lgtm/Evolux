import os
import re

components_dir = r'c:\Users\joaom\InfroPay\src\components'
views = [
    'AfiliadosView.tsx', 'AnalyticsView.tsx', 'ConfiguracoesView.tsx',
    'DocumentacaoView.tsx', 'FerramentasView.tsx', 'MercadoView.tsx',
    'PagamentosView.tsx', 'PremiacoesView.tsx', 'ProdutosView.tsx',
    'SaqueView.tsx', 'VendasView.tsx'
]

for view in views:
    path = os.path.join(components_dir, view)
    if not os.path.exists(path):
        continue
    
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # The headers are usually inside a <motion.div or <div with className containing "space-y-" or just before the <h1/h2
    # A robust way is to find:
    # className="... space-y-x ..." or className="flex ... items-center justify-between"
    # Actually, almost all views use:
    # <div className="flex flex-col xl:flex-row ... justify-between gap-8">
    #     <motion.div ... className="space-y-3">
    #          <h2>...</h2>
    
    # We can replace the first occurrence of:
    # <motion.div\s+initial=\{[\s\S]*?\}\s+animate=\{[\s\S]*?\}\s+className="([^"]*)"\s*>
    # Or just replace `className="space-y-` with `className="ml-14 lg:ml-0 space-y-` ONLY for the first match!
    
    match = re.search(r'className="([^"]*space-y-\d[^"]*)"\s*>\s*<h[12]', content)
    if match:
        old_class = match.group(1)
        if 'ml-14' not in old_class:
            new_class = old_class + ' pl-14 lg:pl-0'
            content = content[:match.start(1)] + new_class + content[match.end(1):]
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated {view}")
    else:
        # Check if there's no space-y, maybe just <h1 or <h2 inside a div
        match2 = re.search(r'(<h[12][^>]*>)', content)
        if match2:
            # Add pl-14 to the h1/h2 itself if we can't find the wrapper easily
            h_tag = match2.group(1)
            if 'pl-14' not in h_tag:
                new_h_tag = h_tag.replace('className="', 'className="pl-14 lg:pl-0 ')
                content = content[:match2.start(1)] + new_h_tag + content[match2.end(1):]
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Updated {view} (added to h tag)")
