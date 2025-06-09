import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  SafeAreaView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme
} from 'react-native';
import { GestureHandlerRootView, PanGestureHandler as RNGHPanGestureHandler, State } from 'react-native-gesture-handler';
import styles from '../../components/styles/styles';

const { width, height } = Dimensions.get('window');

const TodoApp = () => {
  const [tasks, setTasks] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const systemColorScheme = useColorScheme();
  
  // Animation values
  const headerAnimation = useRef(new Animated.Value(0)).current;
  const celebrationAnimation = useRef(new Animated.Value(0)).current;
  const floatingButtonScale = useRef(new Animated.Value(1)).current;
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const inputFocusAnimation = useRef(new Animated.Value(0)).current;
  const taskAnimations = useRef({}).current;

  // Load tasks and theme on app start
  useEffect(() => {
    loadTasks();
    loadThemePreference();
  }, []);

  // Save tasks whenever they change
  useEffect(() => {
    saveTasks();
    checkAllCompleted();
    animateProgressBar();
  }, [tasks]);

  // Update theme based on system preference
  useEffect(() => {
    if (systemColorScheme) {
      setIsDarkMode(systemColorScheme === 'dark');
    }
  }, [systemColorScheme]);

  // Animate header on mount
  useEffect(() => {
    Animated.stagger(200, [
      Animated.spring(headerAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }),
      Animated.spring(inputFocusAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      })
    ]).start();
  }, []);

  const loadTasks = async () => {
    try {
      const savedTasks = await AsyncStorage.getItem('tasks');
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
      } else {
        const defaultTasks = [
          { id: 1, text: 'Welcome to your beautiful todo app! 🎉', completed: false },
          { id: 2, text: 'Try completing this task', completed: false },
          { id: 3, text: 'Swipe right to delete tasks', completed: false }
        ];
        setTasks(defaultTasks);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const saveTasks = async () => {
    try {
      await AsyncStorage.setItem('tasks', JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  };

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('isDarkMode');
      if (savedTheme !== null) {
        setIsDarkMode(JSON.parse(savedTheme));
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const saveThemePreference = async (theme) => {
    try {
      await AsyncStorage.setItem('isDarkMode', JSON.stringify(theme));
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    saveThemePreference(newTheme);
    
    // Theme toggle animation
    Animated.sequence([
      Animated.timing(headerAnimation, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(headerAnimation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateProgressBar = () => {
    const completedCount = tasks.filter(task => task.completed).length;
    const totalCount = tasks.length;
    const targetProgress = totalCount > 0 ? completedCount / totalCount : 0;
    
    Animated.timing(progressAnimation, {
      toValue: targetProgress,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  const addTask = () => {
    if (inputValue.trim() !== '') {
      const newTask = {
        id: Date.now(),
        text: inputValue.trim(),
        completed: false
      };
      setTasks([...tasks, newTask]);
      setInputValue('');
      
      // Enhanced button animation
      Animated.sequence([
        Animated.parallel([
          Animated.timing(floatingButtonScale, {
            toValue: 0.85,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(inputFocusAnimation, {
            toValue: 0.95,
            duration: 100,
            useNativeDriver: true,
          })
        ]),
        Animated.parallel([
          Animated.spring(floatingButtonScale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 300,
            friction: 6,
          }),
          Animated.spring(inputFocusAnimation, {
            toValue: 1,
            useNativeDriver: true,
            tension: 200,
            friction: 8,
          })
        ])
      ]).start();
    }
  };

  const deleteTask = (id) => {
    // Enhanced delete animation
    if (taskAnimations[id]) {
      Animated.parallel([
        Animated.timing(taskAnimations[id], {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(getTaskSwipeAnimation(id), {
          toValue: width * 1.2,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      ]).start(() => {
        setTasks(tasks.filter(task => task.id !== id));
        delete taskAnimations[id];
        delete taskAnimations[`swipe_${id}`];
      });
    } else {
      setTasks(tasks.filter(task => task.id !== id));
    }
  };

  const toggleComplete = async (id) => {
    const task = tasks.find(t => t.id === id);
    const isCompleting = !task.completed;
    
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
    
    if (isCompleting) {
      // Enhanced completion animation
      if (taskAnimations[id]) {
        Animated.sequence([
          Animated.timing(taskAnimations[id], {
            toValue: 1.15,
            duration: 200,
            easing: Easing.out(Easing.back(2)),
            useNativeDriver: true,
          }),
          Animated.spring(taskAnimations[id], {
            toValue: 1,
            useNativeDriver: true,
            tension: 200,
            friction: 6,
          }),
        ]).start();
      }
    } else {
      // Uncomplete animation
      if (taskAnimations[id]) {
        Animated.spring(taskAnimations[id], {
          toValue: 1,
          useNativeDriver: true,
          tension: 150,
          friction: 8,
        }).start();
      }
    }
  };

  const checkAllCompleted = () => {
    const incompleteTasks = tasks.filter(t => !t.completed);
    if (tasks.length > 0 && incompleteTasks.length === 0) {
      // Enhanced celebration animation
      Animated.sequence([
        Animated.timing(celebrationAnimation, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.delay(2500),
        Animated.timing(celebrationAnimation, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const getTaskAnimation = (id) => {
    if (!taskAnimations[id]) {
      taskAnimations[id] = new Animated.Value(1);
      // Entrance animation for new tasks
      Animated.sequence([
        Animated.timing(taskAnimations[id], {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.spring(taskAnimations[id], {
          toValue: 1,
          useNativeDriver: true,
          tension: 120,
          friction: 8,
        })
      ]).start();
    }
    return taskAnimations[id];
  };

  const onSwipeGestureEvent = (id) => 
    Animated.event(
      [{ nativeEvent: { translationX: getTaskSwipeAnimation(id) } }],
      { useNativeDriver: true }
    );

  const getTaskSwipeAnimation = (id) => {
    if (!taskAnimations[`swipe_${id}`]) {
      taskAnimations[`swipe_${id}`] = new Animated.Value(0);
    }
    return taskAnimations[`swipe_${id}`];
  };

  const onSwipeHandlerStateChange = (id) => (event) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, velocityX } = event.nativeEvent;
      const swipeThreshold = width * 0.25;
      
      if (translationX > swipeThreshold || velocityX > 400) {
        // Swipe right detected - delete task with enhanced animation
        Animated.timing(getTaskSwipeAnimation(id), {
          toValue: width * 1.2,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start(() => {
          deleteTask(id);
        });
      } else {
        // Enhanced snap back animation
        Animated.spring(getTaskSwipeAnimation(id), {
          toValue: 0,
          useNativeDriver: true,
          tension: 150,
          friction: 10,
        }).start();
      }
    }
  };

  const theme = getTheme(isDarkMode);
  const completedCount = tasks.filter(task => task.completed).length;
  const totalCount = tasks.length;

  const TaskItem = ({ item, index }) => {
    const taskScale = getTaskAnimation(item.id);
    const taskSwipe = getTaskSwipeAnimation(item.id);
    
    // Staggered entrance animation
    const entranceDelay = index * 100;
    
    return (
      <RNGHPanGestureHandler
        onGestureEvent={onSwipeGestureEvent(item.id)}
        onHandlerStateChange={onSwipeHandlerStateChange(item.id)}
      >
        <Animated.View
          style={[
            styles.taskCard,
            { backgroundColor: theme.cardBackground },
            {
              transform: [
                { scale: taskScale },
                { translateX: taskSwipe },
                {
                  translateY: headerAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
              opacity: headerAnimation.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 0.7, 1],
              }),
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.checkbox,
              { borderColor: item.completed ? theme.accent : theme.border },
              item.completed && { backgroundColor: theme.accent }
            ]}
            onPress={() => toggleComplete(item.id)}
            activeOpacity={0.7}
          >
            {item.completed && (
              <Animated.Text 
                style={[
                  styles.checkmark, 
                  { color: theme.checkmarkColor },
                  {
                    transform: [{
                      scale: taskScale.interpolate({
                        inputRange: [1, 1.15],
                        outputRange: [1, 1.3],
                        extrapolate: 'clamp',
                      })
                    }]
                  }
                ]}
              >
                ✓
              </Animated.Text>
            )}
          </TouchableOpacity>
          
          <Animated.Text style={[
            styles.taskText,
            { color: theme.text },
            item.completed && { 
              color: theme.completedText,
              textDecorationLine: 'line-through' 
            },
            {
              opacity: taskSwipe.interpolate({
                inputRange: [0, width * 0.3],
                outputRange: [1, 0.3],
                extrapolate: 'clamp',
              })
            }
          ]}>
            {item.text}
          </Animated.Text>
          
          <Animated.View 
            style={[
              styles.swipeHint,
              {
                opacity: taskSwipe.interpolate({
                  inputRange: [0, width * 0.1, width * 0.3],
                  outputRange: [0.6, 1, 0],
                  extrapolate: 'clamp',
                })
              }
            ]}
          >
          </Animated.View>
        </Animated.View>
      </RNGHPanGestureHandler>
    );
  };

  const renderTask = ({ item, index }) => <TaskItem item={item} index={index} />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar
          barStyle={isDarkMode ? "light-content" : "dark-content"}
          backgroundColor={theme.statusBar}
        />
        
        {/* Enhanced Animated Header */}
        <Animated.View
          style={[
            styles.header,
            {
              transform: [
                {
                  translateY: headerAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-120, 0],
                  }),
                },
                {
                  scale: headerAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                }
              ],
              opacity: headerAnimation,
            },
          ]}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Animated.Text 
                style={[
                  styles.title, 
                  { color: theme.headerText },
                  {
                    transform: [{
                      translateX: headerAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-50, 0],
                      })
                    }]
                  }
                ]}
              >
                My Tasks
              </Animated.Text>
              <Animated.Text 
                style={[
                  styles.subtitle, 
                  { color: theme.headerSubtext },
                  {
                    transform: [{
                      translateX: headerAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-30, 0],
                      })
                    }]
                  }
                ]}
              >
                {completedCount} of {totalCount} completed
              </Animated.Text>
            </View>
            
            <Animated.View
              style={{
                transform: [{
                  rotate: headerAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['45deg', '0deg'],
                  })
                }]
              }}
            >
              <TouchableOpacity
                style={[styles.themeToggle, { backgroundColor: theme.toggleBackground }]}
                onPress={toggleTheme}
                activeOpacity={0.7}
              >
                <Text style={styles.themeToggleText}>
                  {isDarkMode ? '🌙' : '☀️'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
          
          {/* Enhanced Progress Bar */}
          <View style={[styles.progressContainer, { backgroundColor: theme.progressBackground }]}>
            <Animated.View
              style={[
                styles.progressBar,
                { backgroundColor: theme.accent },
                {
                  width: progressAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                  transform: [{
                    scaleY: progressAnimation.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [1, 1.2, 1],
                    })
                  }]
                },
              ]}
            />
          </View>
        </Animated.View>

        {/* Enhanced Add Task Section */}
        <Animated.View 
          style={[
            styles.addSection, 
            { backgroundColor: theme.cardBackground },
            {
              transform: [
                { scale: inputFocusAnimation },
                {
                  translateY: headerAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  })
                }
              ],
              opacity: headerAnimation,
            }
          ]}
        >
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: theme.inputBackground,
                borderColor: theme.border,
                color: theme.text
              }
            ]}
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="Add a new task..."
            placeholderTextColor={theme.placeholder}
            onSubmitEditing={addTask}
            returnKeyType="done"
            onFocus={() => {
              Animated.spring(inputFocusAnimation, {
                toValue: 1.02,
                useNativeDriver: true,
                tension: 200,
                friction: 8,
              }).start();
            }}
            onBlur={() => {
              Animated.spring(inputFocusAnimation, {
                toValue: 1,
                useNativeDriver: true,
                tension: 200,
                friction: 8,
              }).start();
            }}
          />
          <Animated.View style={{ transform: [{ scale: floatingButtonScale }] }}>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.accent }]}
              onPress={addTask}
              activeOpacity={0.8}
            >
              <Animated.Text 
                style={[
                  styles.addButtonText, 
                  { color: theme.buttonText },
                  {
                    transform: [{
                      rotate: floatingButtonScale.interpolate({
                        inputRange: [0.85, 1],
                        outputRange: ['180deg', '0deg'],
                      })
                    }]
                  }
                ]}
              >
                +
              </Animated.Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Tasks List */}
        {tasks.length === 0 ? (
          <Animated.View
            style={[
              styles.emptyState,
              {
                opacity: headerAnimation.interpolate({
                  inputRange: [0, 0.8, 1],
                  outputRange: [0, 0.5, 1],
                }),
                transform: [
                  {
                    translateY: headerAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [80, 0],
                    }),
                  },
                  {
                    scale: headerAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  }
                ],
              },
            ]}
          >
            <Animated.Text 
              style={[
                styles.emptyEmoji,
                {
                  transform: [{
                    rotate: headerAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['45deg', '0deg'],
                    })
                  }]
                }
              ]}
            >
            </Animated.Text>
            <Text style={[styles.emptyText, { color: theme.text }]}>
              No tasks yet. Add one above
            </Text>
          </Animated.View>
        ) : (
          <FlatList
            data={tasks}
            renderItem={renderTask}
            keyExtractor={(item) => item.id.toString()}
            style={[styles.tasksList, { backgroundColor: theme.background }]}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.tasksListContent}
          />
        )}


        {/* Enhanced Celebration Overlay */}
        <Animated.View
          style={[
            styles.celebrationOverlay,
            {
              opacity: celebrationAnimation.interpolate({
                inputRange: [0, 0.3, 1],
                outputRange: [0, 0.8, 1],
              }),
              transform: [
                {
                  scale: celebrationAnimation.interpolate({
                    inputRange: [0, 0.7, 1],
                    outputRange: [0.3, 1.1, 1],
                  }),
                },
              ],
            },
          ]}
          pointerEvents="none"
        >
          <Animated.Text 
            style={[
              styles.celebrationEmoji,
              {
                transform: [
                  {
                    rotate: celebrationAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    })
                  },
                  {
                    scale: celebrationAnimation.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.5, 1.3, 1],
                    })
                  }
                ]
              }
            ]}
          >
            🎉
          </Animated.Text>
          <Animated.Text 
            style={[
              styles.celebrationText, 
              { color: theme.text },
              {
                transform: [{
                  translateY: celebrationAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  })
                }]
              }
            ]}
          >
            All tasks completed!
          </Animated.Text>
          <Animated.Text 
            style={[
              styles.celebrationSubtext, 
              { color: theme.completedText },
              {
                transform: [{
                  translateY: celebrationAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  })
                }]
              }
            ]}
          >
            Great job
          </Animated.Text>
        </Animated.View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const getTheme = (isDark) => ({
  // Background colors
  background: isDark ? '#0A0B1E' : '#F0F4FF',
  cardBackground: isDark 
    ? 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)'
    : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
  inputBackground: isDark ? '#1E1B4B' : '#FFFFFF',
  footerBackground: isDark ? '#1E1B4B' : '#FFFFFF',
  toggleBackground: isDark ? '#312E81' : '#E0E7FF',
  progressBackground: isDark ? '#312E81' : '#E0E7FF',
  
  // Text colors
  text: isDark ? '#F1F5F9' : '#1E293B',
  headerText: isDark ? '#FFFFFF' : '#1E293B',
  headerSubtext: isDark ? '#C7D2FE' : '#64748B',
  completedText: isDark ? '#64748B' : '#94A3B8',
  placeholder: isDark ? '#64748B' : '#94A3B8',
  footerText: isDark ? '#94A3B8' : '#64748B',
  buttonText: '#FFFFFF',
  checkmarkColor: '#FFFFFF',
  swipeHint: isDark ? '#64748B' : '#94A3B8',
  
  // Accent colors
  accent: isDark ? '#3B82F6' : '#6366F1',
  border: isDark ? '#4C1D95' : '#C7D2FE',
  statusBar: isDark ? '#0A0B1E' : '#F0F4FF',
});

export default TodoApp;