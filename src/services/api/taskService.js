import { getApperClient } from "@/services/apperClient";
import { toast } from "react-toastify";

export const taskService = {
  async getAll() {
    try {
      const apperClient = getApperClient();
      
      if (!apperClient) {
        throw new Error("ApperClient not initialized");
      }

      const params = {
        fields: [
          {"field": {"Name": "Id"}},
          {"field": {"Name": "title_c"}},
          {"field": {"Name": "description_c"}},
          {"field": {"Name": "priority_c"}},
          {"field": {"Name": "status_c"}},
          {"field": {"Name": "created_at_c"}},
          {"field": {"Name": "completed_at_c"}}
        ],
        orderBy: [{
          "fieldName": "created_at_c",
          "sorttype": "DESC"
        }]
      };

      const response = await apperClient.fetchRecords("task_c", params);

      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return [];
      }

      // Handle empty or non-existent data
      if (!response?.data?.length) {
        return [];
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching tasks:", error?.response?.data?.message || error);
      return [];
    }
  },

  async getById(id) {
    try {
      const apperClient = getApperClient();
      
      if (!apperClient) {
        throw new Error("ApperClient not initialized");
      }

      const params = {
        fields: [
          {"field": {"Name": "Id"}},
          {"field": {"Name": "title_c"}},
          {"field": {"Name": "description_c"}},
          {"field": {"Name": "priority_c"}},
          {"field": {"Name": "status_c"}},
          {"field": {"Name": "created_at_c"}},
          {"field": {"Name": "completed_at_c"}}
        ]
      };

      const response = await apperClient.getRecordById("task_c", parseInt(id), params);

      if (!response?.data) {
        throw new Error(`Task with Id ${id} not found`);
      }

      return response.data;
    } catch (error) {
      console.error(`Error fetching task ${id}:`, error?.response?.data?.message || error);
      throw error;
    }
  },

  async create(taskData) {
    try {
      const apperClient = getApperClient();
      
      if (!apperClient) {
        throw new Error("ApperClient not initialized");
      }

      const params = {
        records: [{
          title_c: taskData.title,
          description_c: taskData.description || "",
          priority_c: taskData.priority,
          status_c: taskData.status || "active",
          created_at_c: taskData.createdAt || new Date().toISOString(),
          completed_at_c: taskData.completedAt || null
        }]
      };

      const response = await apperClient.createRecord("task_c", params);

      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        throw new Error(response.message);
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success);
        const failed = response.results.filter(r => !r.success);

        if (failed.length > 0) {
          console.error(`Failed to create ${failed.length} records:`, failed);
          failed.forEach(record => {
            record.errors?.forEach(error => toast.error(`${error.fieldLabel}: ${error}`));
            if (record.message) toast.error(record.message);
          });
        }

        if (successful.length > 0) {
          return successful[0].data;
        }
      }

      throw new Error("Failed to create task");
    } catch (error) {
      console.error("Error creating task:", error?.response?.data?.message || error);
      throw error;
    }
  },

  async update(id, updates) {
    try {
      const apperClient = getApperClient();
      
      if (!apperClient) {
        throw new Error("ApperClient not initialized");
      }

      // Map field names from UI to database fields
      const updateData = {
        Id: parseInt(id)
      };

      if (updates.title !== undefined) updateData.title_c = updates.title;
      if (updates.description !== undefined) updateData.description_c = updates.description;
      if (updates.priority !== undefined) updateData.priority_c = updates.priority;
      if (updates.status !== undefined) updateData.status_c = updates.status;
      if (updates.completedAt !== undefined) updateData.completed_at_c = updates.completedAt;

      const params = {
        records: [updateData]
      };

      const response = await apperClient.updateRecord("task_c", params);

      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        throw new Error(response.message);
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success);
        const failed = response.results.filter(r => !r.success);

        if (failed.length > 0) {
          console.error(`Failed to update ${failed.length} records:`, failed);
          failed.forEach(record => {
            record.errors?.forEach(error => toast.error(`${error.fieldLabel}: ${error}`));
            if (record.message) toast.error(record.message);
          });
        }

        if (successful.length > 0) {
          return successful[0].data;
        }
      }

      throw new Error("Failed to update task");
    } catch (error) {
      console.error("Error updating task:", error?.response?.data?.message || error);
      throw error;
    }
  },

  async delete(id) {
    try {
      const apperClient = getApperClient();
      
      if (!apperClient) {
        throw new Error("ApperClient not initialized");
      }

      const params = {
        RecordIds: [parseInt(id)]
      };

      const response = await apperClient.deleteRecord("task_c", params);

      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return false;
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success);
        const failed = response.results.filter(r => !r.success);

        if (failed.length > 0) {
          console.error(`Failed to delete ${failed.length} records:`, failed);
          failed.forEach(record => {
            if (record.message) toast.error(record.message);
          });
        }

        return successful.length > 0;
      }

      return true;
    } catch (error) {
      console.error("Error deleting task:", error?.response?.data?.message || error);
      return false;
    }
  }
};