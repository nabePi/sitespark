import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Check, Loader2, ExternalLink, Copy, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface AutoDeployProps {
  websiteId: string;
  websiteName: string;
  onDeploy?: (url: string) => void;
}

interface DeployStatus {
  status: 'idle' | 'deploying' | 'success' | 'error';
  url?: string;
  subdomain?: string;
  message?: string;
}

export function AutoDeploy({ websiteId, websiteName, onDeploy }: AutoDeployProps) {
  const [deployStatus, setDeployStatus] = useState<DeployStatus>({ status: 'idle' });
  const [copied, setCopied] = useState(false);

  const handleDeploy = async () => {
    setDeployStatus({ status: 'deploying', message: 'Generating your website...' });

    try {
      // Step 1: Deploy website
      const response = await api.post('/deploy', { websiteId });
      
      // ApiResponse wraps data in .data property
      const result = response.data.data as { subdomain: string; url: string; status: string };
      const { subdomain, url, status } = result;
      
      setDeployStatus({
        status: status === 'deployed' ? 'success' : 'error',
        url,
        subdomain,
        message: status === 'deployed' 
          ? 'Your website is live!' 
          : 'Deployment failed'
      });

      if (status === 'deployed' && onDeploy) {
        onDeploy(url);
      }
    } catch (error: any) {
      setDeployStatus({
        status: 'error',
        message: error.response?.data?.error || 'Failed to deploy website'
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Don't show if already deployed successfully
  if (deployStatus.status === 'success' && deployStatus.url) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full"
      >
        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-green-900 mb-1">
                Website Published Successfully! 🎉
              </h3>
              <p className="text-sm text-green-700 mb-3">
                Your website is now live and accessible worldwide.
              </p>
              
              {/* URL Display */}
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur rounded-lg p-3 border border-green-200">
                <Globe className="w-4 h-4 text-green-600 flex-shrink-0" />
                <code className="flex-1 text-sm text-slate-700 truncate">
                  {deployStatus.url}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => copyToClipboard(deployStatus.url!)}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => window.open(deployStatus.url, '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>

              {/* Subdomain info */}
              <p className="text-xs text-green-600 mt-2">
                Subdomain: <strong>{deployStatus.subdomain}</strong>
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <Card className="p-6 glass-card">
        <div className="text-center">
          {/* Icon */}
          <div className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4",
            deployStatus.status === 'deploying' 
              ? 'bg-primary/10' 
              : 'bg-gradient-to-br from-primary/20 to-cta/20'
          )}>
            <AnimatePresence mode="wait">
              {deployStatus.status === 'deploying' ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </motion.div>
              ) : deployStatus.status === 'error' ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <span className="text-2xl">😕</span>
                </motion.div>
              ) : (
                <motion.div
                  key="ready"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Globe className="w-8 h-8 text-primary" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {deployStatus.status === 'deploying' 
              ? 'Publishing Your Website...'
              : deployStatus.status === 'error'
              ? 'Deployment Failed'
              : 'Ready to Publish!'
            }
          </h3>

          {/* Message */}
          <p className="text-sm text-slate-600 mb-4">
            {deployStatus.message || (
              deployStatus.status === 'idle' &&
              `"${websiteName}" is ready to go live. Get your own subdomain instantly!`
            )}
          </p>

          {/* Error retry */}
          {deployStatus.status === 'error' && (
            <Button
              onClick={handleDeploy}
              variant="outline"
              className="mr-2"
            >
              Try Again
            </Button>
          )}

          {/* Deploy Button */}
          {deployStatus.status !== 'deploying' && deployStatus.status !== 'error' && (
            <Button
              onClick={handleDeploy}
              className="bg-gradient-to-r from-primary to-cta hover:opacity-90 text-white"
              size="lg"
            >
              <Globe className="w-4 h-4 mr-2" />
              Publish Website
            </Button>
          )}

          {/* Deploying indicator */}
          {deployStatus.status === 'deploying' && (
            <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>This may take a few seconds...</span>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
