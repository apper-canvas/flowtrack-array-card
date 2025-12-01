import React, { useState } from 'react'
import { ApperImageFieldComponent } from '@/components/atoms/ImageUploader/ApperImageFieldComponent'
import { motion } from "framer-motion"
import Button from "@/components/atoms/Button"
import Input from "@/components/atoms/Input"
import Select from "@/components/atoms/Select"
import Textarea from "@/components/atoms/Textarea"
import ApperIcon from "@/components/ApperIcon"
import ApperFileFieldComponent from "@/components/atoms/FileUploader/ApperFileFieldComponent"

const TaskForm = ({ onAddTask }) => {
  const [title, setTitle] = useState("")
const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("medium")
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
const [uploadedFiles, setUploadedFiles] = useState([])
  const [uploadedImages, setUploadedImages] = useState([])
  const [fileError, setFileError] = useState(null)
  
  const validateForm = () => {
    const newErrors = {}
    
    if (!title.trim()) {
      newErrors.title = "Task title is required"
    }
    
    return newErrors
  }

const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    const newErrors = {}
    if (!title.trim()) newErrors.title = "Title is required"
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    setFileError(null)

    try {
      // Get files from the file uploader
// Get files and images separately
      let files = [];
      let images = [];
      
      if (window.ApperSDK) {
        try {
          const { ApperFileUploader } = window.ApperSDK;
          files = await ApperFileUploader.FileField.getFiles('file_data_c') || [];
          images = await ApperFileUploader.FileField.getFiles('image_data_c') || [];
        } catch (fileGetError) {
          console.warn('Could not retrieve files from uploader:', fileGetError);
          files = uploadedFiles; // Fallback to state files
          images = uploadedImages; // Fallback to state images
        }
      } else {
        files = uploadedFiles; // Fallback if SDK not available
        images = uploadedImages; // Fallback if SDK not available
      }
console.log("files:", files, "images:", images)
      const taskData = {
        title: title.trim(),
        description: description.trim(),
        priority,
        status: "active",
        createdAt: new Date().toISOString(),
        completedAt: null,
        file_data_c: files,
        image_data_c: images
      };
      await onAddTask(taskData);

      // Reset form
      setTitle("")
      setDescription("")
      setPriority("medium")
setErrors({})
      setUploadedFiles([])
      setUploadedImages([])
      setFileError(null)
    } catch (error) {
      console.error("Error adding task:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "high": return "AlertTriangle"
      case "medium": return "AlertCircle"
      case "low": return "Minus"
      default: return "AlertCircle"
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "text-error-500"
      case "medium": return "text-warning-500"
      case "low": return "text-slate-500"
      default: return "text-slate-500"
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
            <ApperIcon name="Plus" className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Add New Task</h2>
            <p className="text-sm text-slate-600">Capture your next important task</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Task Title <span className="text-error-500">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              error={errors.title}
              className={errors.title ? "border-error-300" : ""}
            />
            {errors.title && (
              <motion.p 
                className="text-sm text-error-600 flex items-center space-x-1"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <ApperIcon name="AlertCircle" className="w-4 h-4" />
                <span>{errors.title}</span>
              </motion.p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details about this task..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Priority
            </label>
            <div className="relative">
              <Select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </Select>
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <ApperIcon 
                  name={getPriorityIcon(priority)} 
                  className={`w-4 h-4 ${getPriorityColor(priority)}`} 
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              size="lg"
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Adding...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <ApperIcon name="Plus" className="w-4 h-4" />
                  <span>Add Task</span>
                </div>
              )}
            </Button>
</div>

{/* File Upload Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              <div className="flex items-center space-x-2">
                <ApperIcon name="Paperclip" className="w-4 h-4" />
                <span>Attach Files</span>
              </div>
            </label>
            <ApperFileFieldComponent
              elementId="task-files"
              config={{
                fieldName: 'file_data_c',
                fieldKey: 'file_data_c',
                tableName: 'file_c',
                apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
                apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY,
                existingFiles: uploadedFiles,
                fileCount: uploadedFiles.length
              }}
            />
          </div>

          {/* Image Upload Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              <div className="flex items-center space-x-2">
                <ApperIcon name="Image" className="w-4 h-4" />
                <span>Attach Images</span>
              </div>
            </label>
            <ApperImageFieldComponent
              elementId="task-images"
              config={{
                fieldName: 'image_data_c',
                fieldKey: 'image_data_c',
                tableName: 'file_c',
                apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
                apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY,
                existingFiles: uploadedImages,
                fileCount: uploadedImages.length
              }}
            />
            {fileError && (
              <p className="text-error-500 text-xs mt-1">{fileError}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <ApperIcon name="Loader2" className="w-4 h-4 animate-spin" />
                  <span>Creating Task...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <ApperIcon name="Plus" className="w-4 h-4" />
                  <span>Create Task</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  )
}

export default TaskForm