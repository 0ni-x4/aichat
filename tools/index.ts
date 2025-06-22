// Memory management tools
export {
  createMemoryTool,
  getMemoriesTool,
  updateMemoryTool,
  deleteMemoryTool,
} from './memory-tools'

// Project management tools
export {
  getProjectsTool,
  getProjectTool,
  createProjectTool,
  updateProjectTool,
} from './project-tools'

// Analytics and context tools
export {
  getMemoryStatsTool,
  getMemoryAnalyticsTool,
  getCurrentProjectContextTool,
} from './analytics-tools'

// Combined toolset for AI SDK
import { 
  createMemoryTool,
  getMemoriesTool,
  updateMemoryTool,
  deleteMemoryTool,
} from './memory-tools'

import {
  createGeneralMemoryTool,
  getGeneralMemoriesTool,
  updateGeneralMemoryTool,
  deleteGeneralMemoryTool,
} from './general-memory-tools'

import {
  getProjectsTool,
  getProjectTool,
  createProjectTool,
  updateProjectTool,
} from './project-tools'

import {
  getMemoryStatsTool,
  getMemoryAnalyticsTool,
  getCurrentProjectContextTool,
} from './analytics-tools'

/**
 * Complete toolset for Coreframe AI Assistant
 * Provides comprehensive project and memory management capabilities
 */
export const coreframeTools = {
  // Project Memory Management
  createMemory: createMemoryTool,
  getMemories: getMemoriesTool,
  updateMemory: updateMemoryTool,
  deleteMemory: deleteMemoryTool,
  
  // General Memory Management
  createGeneralMemory: createGeneralMemoryTool,
  getGeneralMemories: getGeneralMemoriesTool,
  updateGeneralMemory: updateGeneralMemoryTool,
  deleteGeneralMemory: deleteGeneralMemoryTool,
  
  // Project Management
  getProjects: getProjectsTool,
  getProject: getProjectTool,
  createProject: createProjectTool,
  updateProject: updateProjectTool,
  
  // Analytics & Context
  getMemoryStats: getMemoryStatsTool,
  getMemoryAnalytics: getMemoryAnalyticsTool,
  getCurrentProjectContext: getCurrentProjectContextTool,
} 