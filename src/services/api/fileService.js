import { getApperClient } from '@/services/apperClient';
import { toast } from 'react-toastify';

export const fileService = {
async create(fileData, taskId) {
    try {
      if (!taskId) {
        throw new Error("Task ID is required to create file records");
      }

      const apperClient = getApperClient();
      if (!apperClient) {
        throw new Error("ApperClient not initialized");
      }

      const records = [];

      // Handle regular files
      if (fileData.file_data_c && fileData.file_data_c.length > 0) {
        let convertedFiles = fileData.file_data_c;
        const { ApperFileUploader } = window.ApperSDK;
        convertedFiles = ApperFileUploader.toCreateFormat(convertedFiles);

        records.push({
          Name: `Task ${taskId} Files`,
          file_name_c: fileData.file_data_c[0]?.Name || "Attached File",
          file_size_c: fileData.file_data_c[0]?.Size || 0,
          upload_date_c: new Date().toISOString(),
          description_c: fileData.description || "File attachment",
          file_type_c: fileData.file_data_c[0]?.Type || "application/octet-stream",
          task_c: parseInt(taskId),
          file_data_c: convertedFiles
        });
      }

      // Handle images separately  
      if (fileData.image_data_c && fileData.image_data_c.length > 0) {
        let convertedImages = fileData.image_data_c;
        const { ApperFileUploader } = window.ApperSDK;
        convertedImages = ApperFileUploader.toCreateFormat(convertedImages);

        records.push({
          Name: `Task ${taskId} Images`,
          file_name_c: fileData.image_data_c[0]?.Name || "Attached Image",
          file_size_c: fileData.image_data_c[0]?.Size || 0,
          upload_date_c: new Date().toISOString(),
          description_c: fileData.description || "Image attachment",
          file_type_c: fileData.image_data_c[0]?.Type || "image/jpeg",
          task_c: parseInt(taskId),
          file_data_c: convertedImages
        });
      }

      if (records.length === 0) {
        return null; // No files or images to create
      }

      const params = { records };
      const response = await apperClient.createRecord('file_c', params);

      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return null;
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success);
        const failed = response.results.filter(r => !r.success);

        if (failed.length > 0) {
          console.error(`Failed to create ${failed.length} file records:${JSON.stringify(failed)}`);
          failed.forEach(record => {
            record.errors?.forEach(error => toast.error(`${error.fieldLabel}: ${error}`));
            if (record.message) toast.error(record.message);
          });
        }

        return successful.map(r => r.data);
      }

      return null;
    } catch (error) {
      console.error("File creation error:", error);
      toast.error("Failed to attach files to task");
      return null;
    }
  },

  async getByTaskId(taskId) {
    try {
      const apperClient = getApperClient();
      if (!apperClient) {
        throw new Error("ApperClient not initialized");
      }

      const params = {
fields: [
          {"field": {"Name": "Id"}},
          {"field": {"Name": "Name"}},
          {"field": {"Name": "file_name_c"}},
          {"field": {"Name": "file_size_c"}},
          {"field": {"Name": "upload_date_c"}},
          {"field": {"Name": "description_c"}},
          {"field": {"Name": "file_type_c"}},
          {"field": {"Name": "file_data_c"}},
          {"field": {"Name": "task_c"}}
        ],
        where: [{
          "FieldName": "task_c",
          "Operator": "EqualTo",
          "Values": [parseInt(taskId)],
          "Include": true
        }],
        orderBy: [{
          "fieldName": "upload_date_c",
          "sorttype": "DESC"
        }],
        pagingInfo: {
          "limit": 50,
          "offset": 0
        }
      };

      const response = await apperClient.fetchRecords('file_c', params);

      if (!response.success) {
        console.error(response.message);
        return [];
      }

      return response.data || [];
    } catch (error) {
      console.error("Error fetching task files:", error);
      return [];
    }
  },

  async delete(fileId) {
    try {
      const apperClient = getApperClient();
      if (!apperClient) {
        throw new Error("ApperClient not initialized");
      }

      const params = {
        RecordIds: [parseInt(fileId)]
      };

      const response = await apperClient.deleteRecord('file_c', params);

      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return false;
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success);
        const failed = response.results.filter(r => !r.success);

        if (failed.length > 0) {
          console.error(`Failed to delete ${failed.length} file records:${JSON.stringify(failed)}`);
          failed.forEach(record => {
            if (record.message) toast.error(record.message);
          });
        }

        return successful.length > 0;
      }

      return false;
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Failed to delete file");
      return false;
    }
  }
};