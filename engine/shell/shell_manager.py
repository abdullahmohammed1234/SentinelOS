import subprocess
import os

class ShellManager:
    """
    Manages secure shell execution and terminal interactions.
    """
    
    def execute(self, command, cwd=None):
        """Executes a command and returns the output/error."""
        try:
            # Note: In a production environment, we would be extremely careful with shell=True
            # For SentinelOS, we assume a controlled environment.
            result = subprocess.run(
                command, 
                shell=True, 
                capture_output=True, 
                text=True, 
                cwd=cwd or os.getcwd(),
                timeout=30
            )
            return {
                'stdout': result.stdout,
                'stderr': result.stderr,
                'returncode': result.returncode
            }
        except Exception as e:
            return {
                'stdout': '',
                'stderr': str(e),
                'returncode': -1
            }

    def get_system_info(self):
        """Returns low-level system hardware info using shell commands."""
        uname = self.execute("uname -a")
        uptime = self.execute("uptime")
        return {
            'kernel': uname['stdout'].strip(),
            'uptime': uptime['stdout'].strip()
        }
