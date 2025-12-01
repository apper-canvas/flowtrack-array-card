import React, { useState, useEffect, useRef, useMemo } from 'react';
import ApperIcon from '@/components/ApperIcon';

const ApperImageFieldComponent = ({ elementId, config }) => {
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

  // Memoize existingFiles to prevent unnecessary re-renders
  const memoizedExistingFiles = useMemo(() => {
    if (!config.existingFiles || !Array.isArray(config.existingFiles)) {
      return [];
    }

    // Detect actual changes by comparing length and first file's ID/id
    const currentFiles = config.existingFiles;
    const previousFiles = existingFilesRef.current;

    if (currentFiles.length !== previousFiles.length) {
      return currentFiles;
    }

    if (currentFiles.length === 0) {
      return [];
    }

    // Check if first file changed (indicates different files)
    const currentFirstId = currentFiles[0]?.Id || currentFiles[0]?.id;
    const previousFirstId = previousFiles[0]?.Id || previousFiles[0]?.id;

    if (currentFirstId !== previousFirstId) {
      return currentFiles;
    }

    return previousFiles; // No change detected
  }, [config.existingFiles]);

  // Initial Mount Effect
  useEffect(() => {
    let mounted = true;

    const initializeImageUploader = async () => {
      try {
        setError(null);
        
        // Wait for ApperSDK to load with timeout
        let attempts = 0;
        const maxAttempts = 50;
        const checkInterval = 100; // 100ms

        while (!window.ApperSDK && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, checkInterval));
          attempts++;
        }

        if (!window.ApperSDK) {
          throw new Error('ApperSDK not loaded. Please ensure the SDK script is included.');
        }

        if (!mounted) return;

        const { ApperFileUploader } = window.ApperSDK;
        elementIdRef.current = `image-uploader-${elementId}`;

        // Mount the image field with filtering for image types only
        await ApperFileUploader.FileField.mount(elementIdRef.current, {
          ...config,
          existingFiles: memoizedExistingFiles,
          acceptedFileTypes: 'image/*', // Restrict to images only
          maxFileSize: 10485760, // 10MB limit for images
          preview: true // Enable image previews
        });

        if (mounted) {
          mountedRef.current = true;
          setIsReady(true);
        }
      } catch (err) {
        console.error('Image uploader mount error:', err);
        if (mounted) {
          setError(err.message);
          setIsReady(false);
        }
      }
    };

    initializeImageUploader();

    // Cleanup function
    return () => {
      mounted = false;
      if (mountedRef.current && window.ApperSDK) {
        try {
          const { ApperFileUploader } = window.ApperSDK;
          ApperFileUploader.FileField.unmount(elementIdRef.current);
          mountedRef.current = false;
          setIsReady(false);
        } catch (err) {
          console.error('Image uploader unmount error:', err);
        }
      }
    };
  }, [elementId, config.fieldKey]);

  // File Update Effect
  useEffect(() => {
    if (!isReady || !window.ApperSDK || !config.fieldKey) return;

    const updateImageFiles = async () => {
      try {
        // Deep equality check with JSON.stringify
        const currentFilesString = JSON.stringify(memoizedExistingFiles);
        const previousFilesString = JSON.stringify(existingFilesRef.current);

        if (currentFilesString === previousFilesString) {
          return; // No change
        }

        existingFilesRef.current = [...memoizedExistingFiles];

        const { ApperFileUploader } = window.ApperSDK;
        let filesToUpdate = memoizedExistingFiles;

        // Format detection: check for .Id vs .id property
        if (filesToUpdate.length > 0) {
          const hasApiFormat = filesToUpdate[0].hasOwnProperty('Id');
          if (hasApiFormat) {
            // Convert from API format to UI format
            filesToUpdate = ApperFileUploader.toUIFormat(filesToUpdate);
          }
        }

        // Update or clear files
        if (filesToUpdate.length > 0) {
          await ApperFileUploader.FileField.updateFiles(config.fieldKey, filesToUpdate);
        } else {
          await ApperFileUploader.FileField.clearField(config.fieldKey);
        }
      } catch (err) {
        console.error('Image files update error:', err);
        setError(err.message);
      }
    };

    updateImageFiles();
  }, [memoizedExistingFiles, isReady, config.fieldKey]);

  // Error UI
  if (error) {
    return (
      <div className="border border-red-200 bg-red-50 rounded-lg p-4">
        <div className="flex items-center space-x-2 text-red-700">
          <ApperIcon name="AlertCircle" className="w-4 h-4" />
          <span className="text-sm font-medium">Image Upload Error</span>
        </div>
        <p className="text-red-600 text-xs mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Main container with unique ID */}
      <div
        id={`image-uploader-${elementId}`}
        className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center transition-colors hover:border-slate-400"
      >
        {!isReady ? (
          // Loading UI
          <div className="flex items-center justify-center space-x-2 text-slate-500">
            <ApperIcon name="Loader" className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading image uploader...</span>
          </div>
        ) : (
          // Mounted - SDK takes over this container
          <div className="text-slate-500">
            <ApperIcon name="Image" className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">Image uploader ready</p>
          </div>
        )}
      </div>
    </div>
  );
};

export { ApperImageFieldComponent };