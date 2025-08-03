import React from 'react';

const MoodBadge = ({ mood }) => {
  // Map mood to background color
  const moodColors = {
    happy: 'bg-yellow-500',
    content: 'bg-green-500',
    neutral: 'bg-blue-500',
    tired: 'bg-purple-500',
    lazy: 'bg-orange-500',
    stressed: 'bg-red-500',
    sad: 'bg-indigo-500',
    very_sad: 'bg-gray-500',
    angry: 'bg-rose-500',
    default: 'bg-pink-500'
  };

  // Map mood to emoji
  const moodEmojis = {
    happy: '😊',
    content: '😌',
    neutral: '😐',
    tired: '😴',
    lazy: '🦥',
    stressed: '😰',
    sad: '😢',
    very_sad: '😭',
    angry: '😠',
    default: '🌸'
  };

  // Map mood to text
  const moodText = {
    happy: 'Happy',
    content: 'Content',
    neutral: 'Neutral',
    tired: 'Tired',
    lazy: 'Lazy',
    stressed: 'Stressed',
    sad: 'Sad',
    very_sad: 'Very Sad',
    angry: 'Angry',
    default: 'Unknown'
  };

  const badgeColor = moodColors[mood] || moodColors.default;
  const emoji = moodEmojis[mood] || moodEmojis.default;
  const text = moodText[mood] || moodText.default;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${badgeColor}`}>
      {emoji} {text}
    </span>
  );
};

export default MoodBadge;
