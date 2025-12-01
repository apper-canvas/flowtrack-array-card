import { useState, useEffect, useRef, useMemo } from 'react';
import ApperIcon from '@/components/ApperIcon';

const ApperFileFieldComponent = ({ elementId, config }) => {
  // State for UI-driven values
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  // Refs for tracking lifecycle and preventing memory leaks
  const mountedRef = useRef(false);
  const elementIdRef = useRef(elementId);
  const existingFilesRef = useRef([]);

  // Update elementId ref when it changes
  useEffect(() => {
    elementIdRef.current = elementId;
  }, [elementId]);

  // Memoized existing files to prevent re-renders
  const memoizedExistingFiles = useMemo(() => {
    if (!config.existingFiles || !Array.isArray(config.existingFiles)) {
      return [];
    }
    
    // Return empty array if no files or if files are the same as last render
    if (config.existingFiles.length === 0) {
      return [];
    }
    
    // Check if files have actually changed by comparing length and first file's ID
    const currentFiles = config.existingFiles;
    const previousFiles = existingFilesRef.current;
    
    if (currentFiles.length === previousFiles.length && 
        currentFiles.length > 0 && 
        previousFiles.length > 0 &&
        (currentFiles[0].Id === previousFiles[0].Id || currentFiles[0].id === previousFiles[0].id)) {
      return previousFiles;
    }
    
    return currentFiles;
  }, [config.existingFiles]);

  // Initial Mount Effect
  useEffect(() => {
    let mounted = true;
    let attempts = 0;
    const maxAttempts = 50;

    const initializeSDK = async () => {
      const waitForSDK = () => {
        return new Promise((resolve, reject) => {
          const checkSDK = () => {
            attempts++;
            if (window.ApperSDK) {
              resolve();
            } else if (attempts >= maxAttempts) {
              reject(new Error('ApperSDK not loaded after maximum attempts. Please ensure the SDK script is included.'));
            } else {
              setTimeout(checkSDK, 100); // Check every 100ms
            }
          };
          checkSDK();
        });
      };

      try {
        await waitForSDK();
        
        if (!mounted) return;

        if (!window.ApperSDK) {
          throw new Error('ApperSDK not loaded. Please ensure the SDK script is included before this component.');
        }

        const { ApperFileUploader } = window.ApperSDK;
        elementIdRef.current = `file-uploader-${elementId}`;

        await ApperFileUploader.FileField.mount(elementIdRef.current, {
          ...config,
          existingFiles: memoizedExistingFiles
        });

        if (mounted) {
          mountedRef.current = true;
          setIsReady(true);
        }
      } catch (error) {
        if (mounted) {
          setError(error.message);
          console.error('File field mount error:', error);
        }
      }
    };

    initializeSDK();

    // Cleanup on component destruction
    return () => {
      mounted = false;
      
      if (mountedRef.current && window.ApperSDK) {
        try {
          const { ApperFileUploader } = window.ApperSDK;
          ApperFileUploader.FileField.unmount(elementIdRef.current);
        } catch (error) {
          console.error('File field unmount error:', error);
        }
        
        mountedRef.current = false;
        existingFilesRef.current = [];
      }
    };
  }, [elementId, config.fieldName, config.tableName, config.apperProjectId, config.apperPublicKey]);

  // File Update Effect
  useEffect(() => {
    if (!isReady || !window.ApperSDK || !config.fieldKey) {
      return;
    }

    // Deep equality check with JSON.stringify
    const currentFilesString = JSON.stringify(memoizedExistingFiles);
    const previousFilesString = JSON.stringify(existingFilesRef.current);
    
    if (currentFilesString === previousFilesString) {
      return;
    }

    const updateFiles = async () => {
      try {
        const { ApperFileUploader } = window.ApperSDK;
        
        // Format detection - check for .Id vs .id property
        let filesToUpdate = memoizedExistingFiles;
        
        if (filesToUpdate.length > 0 && filesToUpdate[0].Id && !filesToUpdate[0].id) {
          // Convert from API format to UI format
          filesToUpdate = ApperFileUploader.toUIFormat(filesToUpdate);
        }

        if (filesToUpdate.length > 0) {
          await ApperFileUploader.FileField.updateFiles(config.fieldKey, filesToUpdate);
        } else {
          await ApperFileUploader.FileField.clearField(config.fieldKey);
        }

        existingFilesRef.current = memoizedExistingFiles;
      } catch (error) {
        setError(error.message);
        console.error('File field update error:', error);
      }
    };

    updateFiles();
  }, [memoizedExistingFiles, isReady, config.fieldKey]);

  // Error UI
  if (error) {
    return (
      <div className="border border-red-200 rounded-lg p-4 bg-red-50">
        <div className="flex items-center space-x-2 text-red-600">
          <ApperIcon name="AlertCircle" className="w-5 h-5" />
          <span className="text-sm font-medium">File Upload Error</span>
        </div>
        <p className="text-red-500 text-xs mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Main container with unique ID */}
      <div 
        id={`file-uploader-${elementId}`}
        className="min-h-[120px] border-2 border-dashed border-gray-300 rounded-lg p-4"
      >
        {/* Loading UI */}
        {!isReady && (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="animate-spin">
                <ApperIcon name="Loader2" className="w-5 h-5" />
              </div>
              <span className="text-sm">Initializing file uploader...</span>
            </div>
          </div>
        )}
        {/* SDK takes over when ready */}
      </div>
      
      <div className="text-xs text-gray-500 space-y-1">
        <p>Drag and drop files here, or click to select files</p>
        <p>Maximum 5 files allowed</p>
      </div>
    </div>
  );
};

export default ApperFileFieldComponent;