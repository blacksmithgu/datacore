/**
 * @fileoverview Vite module for Datacore
 * 
 * This module provides browser-compatible Vite functionality integrated into Datacore.
 * It follows Datacore's API patterns and provides both high-level and low-level APIs.
 * 
 * @module vite
 */

// Main browser Vite implementation
export { default as browserVite } from './browser-vite-endpoint';

// Lower-level API for advanced control
export * from './lower-level-vite';

// Vite entry point for pre-built components
export * from './vite-entry';