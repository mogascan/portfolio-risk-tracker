# backend/app/services/scheduler_service.py
import logging
import asyncio
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Callable, Awaitable
import threading

logger = logging.getLogger(__name__)

class TaskScheduler:
    """Service for scheduling and running periodic tasks"""
    
    def __init__(self):
        self.tasks = {}
        self.running_tasks = {}
        self.stop_event = asyncio.Event()
        self.lock = threading.Lock()
        self._is_running = False
    
    def add_task(
        self,
        name: str,
        func: Callable[..., Awaitable[Any]],
        interval_seconds: int,
        args: tuple = (),
        kwargs: Dict[str, Any] = {},
        start_immediately: bool = False
    ) -> None:
        """
        Add a task to the scheduler
        
        Args:
            name: Task name (must be unique)
            func: Async function to call
            interval_seconds: Interval between task runs in seconds
            args: Positional arguments to pass to the function
            kwargs: Keyword arguments to pass to the function
            start_immediately: Whether to run the task immediately on start
        """
        with self.lock:
            self.tasks[name] = {
                "func": func,
                "interval": interval_seconds,
                "args": args,
                "kwargs": kwargs,
                "last_run": None if start_immediately else datetime.now(),
                "next_run": datetime.now() if start_immediately else datetime.now() + timedelta(seconds=interval_seconds)
            }
            
            logger.info(f"Added task '{name}' with interval {interval_seconds} seconds")
    
    def remove_task(self, name: str) -> bool:
        """
        Remove a task from the scheduler
        
        Args:
            name: Task name
            
        Returns:
            True if the task was removed, False if it wasn't found
        """
        with self.lock:
            if name in self.tasks:
                del self.tasks[name]
                logger.info(f"Removed task '{name}'")
                return True
            
            return False
    
    def get_task_status(self, name: str) -> Optional[Dict[str, Any]]:
        """
        Get the status of a task
        
        Args:
            name: Task name
            
        Returns:
            Task status dictionary or None if the task wasn't found
        """
        with self.lock:
            if name in self.tasks:
                task = self.tasks[name].copy()
                # Convert function to string for display
                task["func"] = task["func"].__name__
                
                # Add running status
                task["is_running"] = name in self.running_tasks
                
                return task
            
            return None
    
    def get_all_task_statuses(self) -> Dict[str, Dict[str, Any]]:
        """
        Get the status of all tasks
        
        Returns:
            Dictionary mapping task names to task status dictionaries
        """
        with self.lock:
            result = {}
            for name, task in self.tasks.items():
                task_copy = task.copy()
                # Convert function to string for display
                task_copy["func"] = task_copy["func"].__name__
                
                # Add running status
                task_copy["is_running"] = name in self.running_tasks
                
                result[name] = task_copy
            
            return result
    
    async def run_task(self, name: str) -> Any:
        """
        Run a task immediately
        
        Args:
            name: Task name
            
        Returns:
            Task result
        
        Raises:
            KeyError: If the task wasn't found
        """
        task = None
        with self.lock:
            if name not in self.tasks:
                raise KeyError(f"Task '{name}' not found")
            
            task = self.tasks[name]
            self.running_tasks[name] = True
        
        try:
            result = await task["func"](*task["args"], **task["kwargs"])
            
            with self.lock:
                now = datetime.now()
                self.tasks[name]["last_run"] = now
                self.tasks[name]["next_run"] = now + timedelta(seconds=task["interval"])
                
            logger.info(f"Task '{name}' executed successfully")
            return result
        
        except Exception as e:
            logger.error(f"Error executing task '{name}': {str(e)}")
            raise
        
        finally:
            with self.lock:
                if name in self.running_tasks:
                    del self.running_tasks[name]
    
    async def _run_scheduler(self) -> None:
        """Run the scheduler loop"""
        self._is_running = True
        logger.info("Scheduler started")
        
        while not self.stop_event.is_set():
            try:
                now = datetime.now()
                
                # Find tasks that need to be run
                tasks_to_run = []
                with self.lock:
                    for name, task in self.tasks.items():
                        if name not in self.running_tasks and task["next_run"] <= now:
                            tasks_to_run.append(name)
                
                # Run tasks
                for name in tasks_to_run:
                    try:
                        # Run in background
                        asyncio.create_task(self.run_task(name))
                    except Exception as e:
                        logger.error(f"Error starting task '{name}': {str(e)}")
                
                # Sleep for a short time
                await asyncio.sleep(1)
                
            except Exception as e:
                logger.error(f"Error in scheduler loop: {str(e)}")
                await asyncio.sleep(5)  # Sleep longer after an error
        
        self._is_running = False
        logger.info("Scheduler stopped")
    
    async def start(self) -> None:
        """Start the scheduler"""
        if self._is_running:
            logger.warning("Scheduler is already running")
            return
        
        self.stop_event.clear()
        asyncio.create_task(self._run_scheduler())
    
    async def stop(self) -> None:
        """Stop the scheduler"""
        if not self._is_running:
            logger.warning("Scheduler is not running")
            return
        
        self.stop_event.set()
        
        # Wait for the scheduler to stop
        while self._is_running:
            await asyncio.sleep(0.1)
    
    def is_running(self) -> bool:
        """
        Check if the scheduler is running
        
        Returns:
            True if the scheduler is running, False otherwise
        """
        return self._is_running 