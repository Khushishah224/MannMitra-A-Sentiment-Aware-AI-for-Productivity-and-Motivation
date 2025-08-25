"""
MannMitra Decision Helper Module - Sprint 4
Implements fuzzy logic for decision making between two options based on context and user state.
"""
from typing import Dict, Any, Tuple, Optional
import re
import json

# Will be enabled when scikit-fuzzy is installed
try:
    import numpy as np
    import skfuzzy as fuzz
    from skfuzzy import control as ctrl
    FUZZY_AVAILABLE = True
    print("Fuzzy logic module loaded successfully")
except ImportError:
    FUZZY_AVAILABLE = False
    print("Warning: scikit-fuzzy not available, using simplified decision logic")

class DecisionHelper:
    """
    Decision helper using fuzzy logic to provide advice between two options.
    
    Uses context factors like:
    - Time pressure (e.g., exam proximity)
    - Energy/fatigue level
    - Importance/priority
    
    And makes recommendations with confidence levels.
    """
    
    def __init__(self):
        """Initialize the decision helper with fuzzy logic system if available."""
        self.fuzzy_system = self._create_fuzzy_system() if FUZZY_AVAILABLE else None
    
    def _create_fuzzy_system(self):
        """
        Create the fuzzy logic system with input and output variables.
        
        Returns:
            dict: The fuzzy logic control system
        """
        try:
            # Define input variables
            time_pressure = ctrl.Antecedent(np.arange(0, 11, 1), 'time_pressure')
            fatigue = ctrl.Antecedent(np.arange(0, 11, 1), 'fatigue')
            task_importance = ctrl.Antecedent(np.arange(0, 11, 1), 'task_importance')
            
            # Define output variable
            decision = ctrl.Consequent(np.arange(0, 11, 1), 'decision')
            
            # Define membership functions for inputs
            time_pressure['low'] = fuzz.trimf(time_pressure.universe, [0, 0, 5])
            time_pressure['medium'] = fuzz.trimf(time_pressure.universe, [0, 5, 10])
            time_pressure['high'] = fuzz.trimf(time_pressure.universe, [5, 10, 10])
            
            fatigue['low'] = fuzz.trimf(fatigue.universe, [0, 0, 5])
            fatigue['medium'] = fuzz.trimf(fatigue.universe, [0, 5, 10])
            fatigue['high'] = fuzz.trimf(fatigue.universe, [5, 10, 10])
            
            task_importance['low'] = fuzz.trimf(task_importance.universe, [0, 0, 5])
            task_importance['medium'] = fuzz.trimf(task_importance.universe, [0, 5, 10])
            task_importance['high'] = fuzz.trimf(task_importance.universe, [5, 10, 10])
            
            # Define membership functions for output
            decision['option1'] = fuzz.trimf(decision.universe, [0, 0, 5])
            decision['balanced'] = fuzz.trimf(decision.universe, [3, 5, 7])
            decision['option2'] = fuzz.trimf(decision.universe, [5, 10, 10])
            
            # Define rules
            rule1 = ctrl.Rule(time_pressure['high'] & task_importance['high'], decision['option1'])
            rule2 = ctrl.Rule(fatigue['high'] & time_pressure['low'], decision['option2'])
            rule3 = ctrl.Rule(fatigue['medium'] & task_importance['medium'], decision['balanced'])
            rule4 = ctrl.Rule(time_pressure['high'] & fatigue['high'], decision['option2'])
            rule5 = ctrl.Rule(task_importance['high'] & fatigue['low'], decision['option1'])
            
            # Create control system
            decision_ctrl = ctrl.ControlSystem([rule1, rule2, rule3, rule4, rule5])
            
            return ctrl.ControlSystemSimulation(decision_ctrl)
        
        except Exception as e:
            print(f"Error creating fuzzy system: {str(e)}")
            return None
    
    def make_decision(
        self,
        option1: str,
        option2: str,
        context: str,
        mood: str,
        time_pressure: float = None,
        fatigue: float = None,
        task_importance: float = None
    ) -> Dict[str, Any]:
        """
        Make a decision between two options using fuzzy logic or heuristics.
        
        Args:
            option1: First option (e.g., "Study for exam")
            option2: Second option (e.g., "Take a break")
            context: Context information about the decision
            mood: Current user mood
            time_pressure: Optional explicit time pressure score (0-10)
            fatigue: Optional explicit fatigue score (0-10)
            task_importance: Optional explicit task importance score (0-10)
            
        Returns:
            dict: Decision information with recommendation and explanation
        """
        # Extract factors from context if not explicitly provided
        if time_pressure is None:
            time_pressure = self._extract_time_pressure(context)
        
        if fatigue is None:
            fatigue = self._extract_fatigue(context, mood)
        
        if task_importance is None:
            task_importance = self._extract_importance(context)
        
        # Use fuzzy logic if available
        if FUZZY_AVAILABLE and self.fuzzy_system:
            return self._fuzzy_decision(
                option1, option2, context, mood,
                time_pressure, fatigue, task_importance
            )
        else:
            # Fallback to rule-based heuristics
            return self._heuristic_decision(
                option1, option2, context, mood,
                time_pressure, fatigue, task_importance
            )
    
    def _fuzzy_decision(
        self, option1, option2, context, mood, 
        time_pressure, fatigue, task_importance
    ) -> Dict[str, Any]:
        """
        Make decision using the fuzzy logic system.
        
        Args:
            option1: First option (e.g., "Study for exam")
            option2: Second option (e.g., "Take a break")
            context: Context information
            mood: User's mood
            time_pressure: Time pressure score (0-10)
            fatigue: Fatigue score (0-10)
            task_importance: Task importance score (0-10)
            
        Returns:
            dict: Decision with recommendation and explanation
        """
        try:
            # Input values to fuzzy system
            self.fuzzy_system.input['time_pressure'] = min(10, max(0, time_pressure))
            self.fuzzy_system.input['fatigue'] = min(10, max(0, fatigue))
            self.fuzzy_system.input['task_importance'] = min(10, max(0, task_importance))
            
            # Compute result
            self.fuzzy_system.compute()
            
            # Get decision score (0-10 where <5 favors option1, >5 favors option2)
            score = self.fuzzy_system.output['decision']
            
            # Determine confidence level based on distance from middle point (5)
            confidence = abs(score - 5) * 20  # 0-100%
            
            # Generate recommendation
            if score < 4:  # Strong preference for option1
                recommendation = option1
                confidence = min(95, confidence)  # Cap at 95%
            elif score > 6:  # Strong preference for option2
                recommendation = option2
                confidence = min(95, confidence)  # Cap at 95%
            else:  # Balanced decision
                # Slightly favor one option based on factors
                if time_pressure > 7:
                    recommendation = option1
                    explanation = "Given the time pressure, a slight preference for"
                elif fatigue > 7:
                    recommendation = option2
                    explanation = "Given your fatigue level, a slight preference for"
                else:
                    # Truly balanced decision
                    recommendation = f"Balance between {option1} and {option2}"
                    return {
                        "recommendation": recommendation,
                        "confidence": 50,
                        "option1_score": 50,
                        "option2_score": 50,
                        "factors": {
                            "time_pressure": time_pressure,
                            "fatigue": fatigue,
                            "task_importance": task_importance
                        },
                        "explanation": self._generate_balanced_explanation(option1, option2, context, mood),
                        "advice": self._generate_advice(option1, option2, context, mood, "balanced")
                    }
            
            # Generate explanation based on factors
            explanation = self._generate_explanation(
                recommendation, option1, option2, context, mood,
                time_pressure, fatigue, task_importance, score
            )
            
            # Generate practical advice
            advice = self._generate_advice(option1, option2, context, mood, 
                                          "option1" if score < 5 else "option2")
            
            # Calculate individual option scores
            if score < 5:
                option1_score = 100 - (score * 10)
                option2_score = score * 10
            else:
                option1_score = (10 - score) * 10
                option2_score = score * 10
            
            return {
                "recommendation": recommendation,
                "confidence": round(confidence),
                "option1_score": round(option1_score),
                "option2_score": round(option2_score),
                "factors": {
                    "time_pressure": time_pressure,
                    "fatigue": fatigue,
                    "task_importance": task_importance
                },
                "explanation": explanation,
                "advice": advice
            }
            
        except Exception as e:
            print(f"Error in fuzzy decision: {str(e)}")
            # Fall back to heuristic
            return self._heuristic_decision(
                option1, option2, context, mood,
                time_pressure, fatigue, task_importance
            )
    
    def _heuristic_decision(
        self, option1, option2, context, mood, 
        time_pressure, fatigue, task_importance
    ) -> Dict[str, Any]:
        """
        Make decision using simple heuristics when fuzzy logic is not available.
        
        Args:
            option1: First option (e.g., "Study for exam")
            option2: Second option (e.g., "Take a break")
            context: Context information
            mood: User's mood
            time_pressure: Time pressure score (0-10)
            fatigue: Fatigue score (0-10)
            task_importance: Task importance score (0-10)
            
        Returns:
            dict: Decision with recommendation and explanation
        """
        # Calculate simple weighted score
        score = 0
        
        # Time pressure pushes toward option1 (usually the work/study option)
        score -= time_pressure * 0.4
        
        # Fatigue pushes toward option2 (usually the rest/leisure option)
        score += fatigue * 0.4
        
        # Importance pushes toward option1
        score -= task_importance * 0.2
        
        # Mood adjustment
        if mood in ["sad", "very_sad", "stressed", "anxious"]:
            score += 1  # Push slightly toward option2 (likely rest/self-care)
        elif mood in ["happy", "motivated"]:
            score -= 1  # Push slightly toward option1 (likely productive)
        
        # Normalize to -5 to +5 range
        score = max(-5, min(5, score))
        
        # Convert to recommendation
        if score < -2:
            recommendation = option1
            confidence = min(90, abs(score) * 15)
            choice = "option1"
        elif score > 2:
            recommendation = option2
            confidence = min(90, abs(score) * 15)
            choice = "option2"
        else:
            recommendation = f"Balance between {option1} and {option2}"
            confidence = 50
            choice = "balanced"
        
        # Calculate individual option scores
        option1_score = max(10, min(90, 50 - (score * 10)))
        option2_score = max(10, min(90, 50 + (score * 10)))
        
        # Generate explanation and advice
        explanation = self._generate_explanation(
            recommendation, option1, option2, context, mood,
            time_pressure, fatigue, task_importance, 5 + score
        )
        
        advice = self._generate_advice(option1, option2, context, mood, choice)
        
        return {
            "recommendation": recommendation,
            "confidence": round(confidence),
            "option1_score": round(option1_score),
            "option2_score": round(option2_score),
            "factors": {
                "time_pressure": time_pressure,
                "fatigue": fatigue,
                "task_importance": task_importance
            },
            "explanation": explanation,
            "advice": advice
        }
    
    def _extract_time_pressure(self, context: str) -> float:
        """
        Extract time pressure factor from context.
        
        Args:
            context: Context information
            
        Returns:
            float: Time pressure score (0-10)
        """
        # Default moderate time pressure
        base_score = 5
        
        # Look for time-related keywords
        context_lower = context.lower()
        
        # Check for exam or deadline proximity
        if "tomorrow" in context_lower or "tonight" in context_lower:
            base_score += 3
        elif "today" in context_lower:
            base_score += 4
        elif "few days" in context_lower or "this week" in context_lower:
            base_score += 2
        elif "next week" in context_lower:
            base_score += 1
        
        # Check for explicit mentions of urgency
        if "urgent" in context_lower or "emergency" in context_lower:
            base_score += 3
        elif "soon" in context_lower or "quickly" in context_lower:
            base_score += 2
        elif "relax" in context_lower or "plenty of time" in context_lower:
            base_score -= 2
        
        # Check for exam proximity
        exam_match = re.search(r"exam\s+in\s+(\d+)\s+(day|days|hour|hours)", context_lower)
        if exam_match:
            count = int(exam_match.group(1))
            unit = exam_match.group(2)
            
            if "hour" in unit:
                if count < 12:
                    base_score = 10  # Extremely urgent
                else:
                    base_score = 9  # Very urgent
            elif "day" in unit:
                if count == 1:
                    base_score = 8  # Very urgent
                elif count == 2:
                    base_score = 7  # Quite urgent
                elif count <= 7:
                    base_score = 6  # Moderately urgent
        
        return min(10, max(0, base_score))
    
    def _extract_fatigue(self, context: str, mood: str) -> float:
        """
        Extract fatigue factor from context and mood.
        
        Args:
            context: Context information
            mood: Current mood
            
        Returns:
            float: Fatigue score (0-10)
        """
        # Start with moderate fatigue
        base_score = 5
        
        # Adjust based on mood
        if mood == "tired":
            base_score += 3
        elif mood == "exhausted":
            base_score += 4
        elif mood == "stressed":
            base_score += 2
        elif mood == "lazy":
            base_score += 2
        elif mood in ["motivated", "happy"]:
            base_score -= 2
        
        # Check context for fatigue indicators
        context_lower = context.lower()
        if "tired" in context_lower or "exhausted" in context_lower:
            base_score += 2
        elif "energetic" in context_lower or "fresh" in context_lower:
            base_score -= 2
        elif "slept well" in context_lower or "good sleep" in context_lower:
            base_score -= 2
        elif "bad sleep" in context_lower or "didn't sleep" in context_lower:
            base_score += 2
        
        return min(10, max(0, base_score))
    
    def _extract_importance(self, context: str) -> float:
        """
        Extract task importance factor from context.
        
        Args:
            context: Context information
            
        Returns:
            float: Importance score (0-10)
        """
        # Default moderate importance
        base_score = 5
        
        # Check context for importance indicators
        context_lower = context.lower()
        if "important" in context_lower or "crucial" in context_lower:
            base_score += 2
        elif "critical" in context_lower or "essential" in context_lower:
            base_score += 3
        elif "final exam" in context_lower or "major test" in context_lower:
            base_score += 3
        elif "minor" in context_lower or "not important" in context_lower:
            base_score -= 2
        
        # Check for educational or career impact words
        if "graduation" in context_lower or "degree" in context_lower:
            base_score += 2
        elif "job" in context_lower or "career" in context_lower:
            base_score += 2
        elif "hobby" in context_lower or "just for fun" in context_lower:
            base_score -= 2
        
        return min(10, max(0, base_score))
    
    def _generate_explanation(
        self, recommendation, option1, option2, context, mood,
        time_pressure, fatigue, task_importance, score
    ) -> str:
        """
        Generate explanation for the decision.
        
        Args:
            recommendation: Recommended option
            option1: First option
            option2: Second option
            context: Context information
            mood: Current mood
            time_pressure: Time pressure score
            fatigue: Fatigue score
            task_importance: Task importance score
            score: Decision score (0-10)
            
        Returns:
            str: Explanation text
        """
        if score < 4:  # Option 1 recommended
            if time_pressure > 7:
                return f"Given the time sensitivity (urgency level: {time_pressure}/10) and that {option1} seems important (importance: {task_importance}/10), I recommend focusing on {option1}."
            elif task_importance > 7:
                return f"Based on the high importance of {option1} (rated {task_importance}/10), this should take priority over {option2}, despite your current fatigue level."
            else:
                return f"Considering all factors, {option1} appears to be the better choice at this moment."
                
        elif score > 6:  # Option 2 recommended
            if fatigue > 7:
                return f"Your current fatigue level ({fatigue}/10) suggests that {option2} would be more beneficial right now. {option1} might be less effective given your energy levels."
            else:
                return f"Based on the context and your current mood, {option2} aligns better with your needs at this moment."
                
        else:  # Balanced recommendation
            return self._generate_balanced_explanation(option1, option2, context, mood)
    
    def _generate_balanced_explanation(self, option1, option2, context, mood) -> str:
        """
        Generate explanation for a balanced decision.
        
        Args:
            option1: First option
            option2: Second option
            context: Context information
            mood: Current mood
            
        Returns:
            str: Explanation text
        """
        return (f"This is a balanced situation where both {option1} and {option2} have merit. "
                f"Consider your priorities and energy level to make the final call. "
                f"You might also explore combining elements of both options.")
    
    def _generate_advice(self, option1, option2, context, mood, choice) -> str:
        """
        Generate practical advice based on the decision.
        
        Args:
            option1: First option
            option2: Second option
            context: Context information
            mood: Current mood
            choice: Which option was chosen ("option1", "option2", or "balanced")
            
        Returns:
            str: Practical advice text
        """
        advice = ""
        
        if choice == "option1":  # Recommending option1 (usually study/work)
            advice = f"Focus on {option1} with these suggestions:\n"
            advice += "• Break it down into smaller, manageable tasks\n"
            advice += "• Set a specific timeframe (e.g., focused work for 25-45 minutes)\n"
            
            # Check if we're recommending work despite fatigue
            context_lower = context.lower()
            if "tired" in context_lower or mood in ["tired", "exhausted", "stressed"]:
                advice += "• Consider a 10-minute power nap before starting\n"
                advice += "• Alternate between sitting and standing if possible\n"
            
            advice += "• Minimize distractions by silencing notifications\n"
            advice += f"• Plan a small reward or {option2} time after completing your session"
            
        elif choice == "option2":  # Recommending option2 (usually rest/leisure)
            advice = f"Choose {option2} with these suggestions:\n"
            advice += "• Set a specific time limit to avoid excessive procrastination\n"
            
            # If it's exam season but recommending rest
            if "exam" in context.lower() or "test" in context.lower():
                advice += "• Use this break strategically - limit it to 30-45 minutes\n"
                advice += f"• Plan your return to {option1} afterward with a specific goal\n"
            
            advice += "• Make this time truly rejuvenating rather than passive scrolling\n"
            advice += "• Consider a brief walk or light movement if choosing rest\n"
            advice += "• Be fully present in your choice without guilt - quality breaks improve productivity"
            
        else:  # Balanced recommendation
            advice = "Since both options have merit, consider these approaches:\n"
            advice += f"• Option A: Start with 25-30 minutes of {option1}, then a 10-15 minute {option2} break\n"
            advice += f"• Option B: Begin with a brief 15-minute {option2} to refresh, then transition to {option1}\n"
            advice += "• Option C: Integrate aspects of both if possible\n"
            advice += "• The key is being fully engaged in whichever activity you choose"
        
        return advice


# Function to make decisions between two options
def evaluate_decision(
    option1: str, 
    option2: str, 
    context: str, 
    mood: str
) -> Dict[str, Any]:
    """
    Evaluate a decision between two options.
    
    Args:
        option1: First option (e.g., "Study for exam")
        option2: Second option (e.g., "Take a break")
        context: Context information about the decision situation
        mood: Current mood of the user
        
    Returns:
        dict: Decision recommendation, confidence, and explanation
    """
    helper = DecisionHelper()
    return helper.make_decision(option1, option2, context, mood)
