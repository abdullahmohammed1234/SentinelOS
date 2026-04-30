import os
import time

class FilesystemScanner:
    """
    Intelligent filesystem scanner for SentinelOS.
    Analyzes directory structures and identifies large/redundant files.
    """
    
    def scan_directory(self, root_path, depth=3):
        """Scans a directory recursively up to a certain depth."""
        result = []
        try:
            for entry in os.scandir(root_path):
                stats = entry.stat()
                is_dir = entry.is_dir()
                
                item = {
                    'name': entry.name,
                    'path': entry.path,
                    'is_directory': is_dir,
                    'size': stats.st_size,
                    'modified': stats.st_mtime,
                    'children': []
                }
                
                if is_dir and depth > 0:
                    # Avoid scanning giant system folders for the demo
                    if entry.name not in ['node_modules', '.git', 'dist', 'proc', 'sys', 'dev']:
                        item['children'] = self.scan_directory(entry.path, depth - 1)
                
                result.append(item)
        except (PermissionError, FileNotFoundError):
            pass
            
        return result

    def find_large_files(self, root_path, min_size_mb=100):
        """Discovers files exceeding a size threshold."""
        large_files = []
        min_bytes = min_size_mb * 1024 * 1024
        
        for root, dirs, files in os.walk(root_path):
            # Skip hidden/system dirs
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['node_modules', 'dist']]
            
            for f in files:
                fp = os.path.join(root, f)
                try:
                    size = os.path.getsize(fp)
                    if size > min_bytes:
                        large_files.append({
                            'name': f,
                            'path': fp,
                            'size': size,
                            'size_formatted': f"{round(size / (1024*1024), 2)} MB"
                        })
                except (OSError, PermissionError):
                    continue
                    
        return sorted(large_files, key=lambda x: x['size'], reverse=True)
