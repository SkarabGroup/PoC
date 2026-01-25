import os
import json
from pathlib import Path
from typing import Dict, List, Any

class SpellAgent:
    """
    Agent with tool calling - the LLM decides which tools to use.
    """
    
    def __init__(self, bedrock_client, model_id: str):
        """
        Initialize the SpellAgent.
        
        Args:
            bedrock_client: Boto3 Bedrock Runtime client
            model_id: Model ID for Bedrock API
        """
        self.bedrock = bedrock_client
        self.model_id = model_id
    
    def get_tool_definitions(self) -> List[Dict[str, Any]]:
        """
        Define the tools available for the agent.
        The LLM will decide which tools to use based on these descriptions.
        
        Returns:
            List of tool definitions
        """
        return [
            {
                "toolSpec": {
                    "name": "find_text_files",
                    "description": "Find all .txt files in a directory recursively, excluding common directories like .git, node_modules, __pycache__, venv, .venv. Returns a list of file paths.",
                    "inputSchema": {
                        "json": {
                            "type": "object",
                            "properties": {
                                "directory": {
                                    "type": "string",
                                    "description": "Root directory to search for text files"
                                }
                            },
                            "required": ["directory"]
                        }
                    }
                }
            },
            {
                "toolSpec": {
                    "name": "read_file_content",
                    "description": "Read the complete content of a specific file. Returns the file content as a string.",
                    "inputSchema": {
                        "json": {
                            "type": "object",
                            "properties": {
                                "file_path": {
                                    "type": "string",
                                    "description": "Full path to the file to read"
                                }
                            },
                            "required": ["file_path"]
                        }
                    }
                }
            },
            {
                "toolSpec": {
                    "name": "analyze_spelling",
                    "description": "Analyze text content for spelling errors. Returns a JSON object with has_errors (boolean), error_count (number), errors (array of {word, suggestion, context}), and summary.",
                    "inputSchema": {
                        "json": {
                            "type": "object",
                            "properties": {
                                "file_path": {
                                    "type": "string",
                                    "description": "Path to the file being analyzed"
                                },
                                "content": {
                                    "type": "string",
                                    "description": "Text content to analyze for spelling errors"
                                }
                            },
                            "required": ["file_path", "content"]
                        }
                    }
                }
            }
        ]
    
    def execute_tool(self, tool_name: str, tool_input: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a specific tool.
        
        Args:
            tool_name: Name of the tool to execute
            tool_input: Input parameters for the tool
            
        Returns:
            Tool execution result
        """
        try:
            if tool_name == "find_text_files":
                return self._find_text_files(tool_input.get("directory"))
            elif tool_name == "read_file_content":
                return self._read_file_content(tool_input.get("file_path"))
            elif tool_name == "analyze_spelling":
                # Get file_path and content, with validation
                file_path = tool_input.get("file_path")
                content = tool_input.get("content")
                
                if not file_path:
                    return {"error": "Missing required parameter: file_path"}
                if not content:
                    return {"error": "Missing required parameter: content"}
                    
                return self._analyze_spelling(file_path, content)
            else:
                return {"error": f"Unknown tool: {tool_name}"}
        except KeyError as e:
            return {"error": f"Missing required parameter: {str(e)}"}
        except Exception as e:
            return {"error": f"Tool execution error: {str(e)}"}
    
    def _find_text_files(self, directory: str) -> Dict[str, Any]:
        """
        Tool implementation: Find all .txt files in the directory recursively.
        """
        try:
            text_files = []
            for root, dirs, files in os.walk(directory):
                # Skip common directories
                dirs[:] = [d for d in dirs if d not in ['.git', 'node_modules', '__pycache__', 'venv', '.venv']]
                
                for file in files:
                    if file.endswith('.txt'):
                        text_files.append(os.path.join(root, file))
            
            return {
                "files_found": len(text_files),
                "file_paths": text_files
            }
        except Exception as e:
            return {
                "error": f"Error finding files: {str(e)}"
            }
    
    def _read_file_content(self, file_path: str) -> Dict[str, Any]:
        """
        Tool implementation: Read content from a file.
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            return {
                "file_path": file_path,
                "content": content,
                "content_length": len(content)
            }
        except Exception as e:
            return {
                "error": f"Error reading file: {str(e)}"
            }
    
    def _analyze_spelling(self, file_path: str, content: str) -> Dict[str, Any]:
        """
        Tool implementation: Analyze text for spelling errors.
        """
        try:
            # Limit content to avoid token limits
            if len(content) > 3000:
                content = content[:3000] + "\n...[truncated]"
            
            prompt = f"""Analyze the following text for spelling errors.

            File: {file_path}
            Content:
            {content}

            Provide a JSON response with this exact structure:
            {{
                "has_errors": true/false,
                "error_count": <number>,
                "errors": [
                    {{"word": "<misspelled_word>", "suggestion": "<correction>", "context": "<surrounding_text>"}}
                ],
                "summary": "<brief_summary>"
            }}"""

            response = self.bedrock.converse(
                modelId=self.model_id,
                messages=[{"role": "user", "content": [{"text": prompt}]}]
            )

            #{
                #"output": {
                    #"message": {
                        #"role": "assistant",
                        #"content": [
                            #{
                                #"text": "Reasoning/thinking text" 
                            #},
                            #{
                                #"toolUse": {  // ←  AWS Standard Format for tool calls
                                    #"toolUseId": "unique-id-generated-by-model",
                                    #"name": "nome_del_tool",
                                    #"input": {"param": "value"}
                                #}
                            #}
                        #]
                    #}
                #},
                #"stopReason": "tool_use"  // ← added by Bedrock
            #}
            
            result_text = response['output']['message']['content'][0]['text']
            
            # Try to extract JSON from the response
            try:
                # Remove markdown code blocks if present
                if '```json' in result_text:
                    result_text = result_text.split('```json')[1].split('```')[0].strip()
                elif '```' in result_text:
                    result_text = result_text.split('```')[1].split('```')[0].strip()
                
                return json.loads(result_text)
            except json.JSONDecodeError:
                return {
                    "has_errors": False,
                    "error_count": 0,
                    "errors": [],
                    "summary": result_text
                }
                
        except Exception as e:
            return {
                "error": f"Error analyzing file: {str(e)}"
            }
    
    def check_spelling(self, directory: str) -> Dict[str, Any]:
        """
        Main method: use tool calling to let the LLM decide how to check spelling.
        
        Args:
            directory: Root directory to analyze
            
        Returns:
            Complete analysis results
        """
        tools = self.get_tool_definitions()
        
        # Initial prompt for the LLM
        initial_prompt = f"""You are a spell-checking agent. Your task is to check spelling in all .txt files in the directory: {directory}

        Please follow these steps:
        1. Find all .txt files in the directory
        2. Read each file's content
        3. Analyze each file for spelling errors
        4. Provide a comprehensive summary

        Use the available tools to complete this task."""

        messages = [{"role": "user", "content": [{"text": initial_prompt}]}]
        
        # Tool calling loop
        max_iterations = int(os.getenv("MAX_AGENT_ITERATIONS", "20"))
        iteration = 0
        all_tool_results = []
        
        while iteration < max_iterations:
            iteration += 1
            
            # Call the model with tools
            response = self.bedrock.converse(
                modelId=self.model_id,
                messages=messages,
                toolConfig={"tools": tools}
            )
            
            output = response['output']['message']
            messages.append(output)
            
            # Check if model wants to use tools
            if response.get('stopReason') == 'tool_use': # stopReason indicates why the model stopped, it id added by Bedrock
                tool_uses = [c for c in output['content'] if 'toolUse' in c]
                tool_results = []
                
                for tool_use in tool_uses:
                    tool_name = tool_use['toolUse']['name']
                    tool_input = tool_use['toolUse']['input']
                    tool_use_id = tool_use['toolUse']['toolUseId']
                    
                    # Execute the tool
                    result = self.execute_tool(tool_name, tool_input)
                    
                    # Store for final output
                    all_tool_results.append({
                        "tool": tool_name,
                        "input": tool_input,
                        "result": result
                    })
                    
                    # Add tool result to conversation
                    tool_results.append({
                        "toolResult": {
                            "toolUseId": tool_use_id,
                            "content": [{"json": result}]
                        }
                    })
                
                # Add tool results to messages
                messages.append({
                    "role": "user",
                    "content": tool_results
                })
            else:
                # Model is done, extract final response
                final_text = ""
                for content in output['content']:
                    if 'text' in content:
                        final_text += content['text']
                
                return {
                    "status": "completed",
                    "summary": final_text,
                    "tool_executions": all_tool_results,
                    "iterations": iteration
                }
        
        # Max iterations reached
        return {
            "status": "max_iterations_reached",
            "message": "Analysis incomplete - reached maximum iterations",
            "tool_executions": all_tool_results,
            "iterations": iteration
        }