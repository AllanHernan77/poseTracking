import React, { useEffect, useState, useRef } from 'react';
import { View } from 'react-native';
import PoseClassifier from './PoseClassifier';

export default function App() {
  return (
    <View>
      <PoseClassifier/>
    </View>
  );
}