import React, { useEffect, useState, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import { fetch ,asyncStorageIO, bundleResourceIO,decodeJpeg} from '@tensorflow/tfjs-react-native'

export default class ClassificationUtil{

    //Sets up stats hooks for the classificatiion util class
    //These can be used throughout the below functions as
    //if they were global variables
    constructor(){
        this.model=null;
        this.model_classes=null;
        this.loadModel.bind(this);
        this.classifyPose.bind(this);
        this.classifyPoses.bind(this);
        this.classifyPosesSorted.bind(this);
        this.getClassifiedPose.bind(this)
        this.getClassifiedPoses.bind(this)
        this.getClassifiedPosesSorted.bind(this)
        this.model_url=null;
    }

    async loadModel(model_url){
        
        //Make sure tf is ready
        await tf.ready();

        //Try server-based model loading
        try {
            this.model = await tf.loadLayersModel(model_url);
            this.model_classes = require('./assets/classes.json');
            console.log("Loaded Tensor Server Model");

        //If server-based doesn't work, then load the statically bundled model
        //from within the source code
        }
        catch {
            const modelJSON = require('./assets/model.json');
            const modelWeights = require('./assets/group1-shard1of1.bin');
            const model_classes = require('./assets/classes.json');
            this.model = await tf.loadLayersModel(bundleResourceIO(modelJSON, modelWeights));
            this.model_classes = model_classes;
            console.log("Loaded Static Model");
        }

        console.log(this.model);
        console.log(this.model_classes);
        

        return [this.model, this.model_classes]
    }

    async classifyPose (keypoints) { 

        //use model to predict
        const array = this.formatArray(keypoints);
        const tensor_of_keypoints = tf.tensor(array);

        //If the model exists then do classification
        if(this.model){
            const predictionTensor = await this.model.predict(tensor_of_keypoints);
            const [poseName, confidence] = await this.getClassifiedPose(predictionTensor,this.model_classes);

            return [poseName, confidence];
        }
    }

    async classifyPoses (keypoints) { 
        //use model to predict
        const array = this.formatArray(keypoints);
        const tensor_of_keypoints = tf.tensor(array);

        //If the model exists then do classification
        if(this.model) {
            const predictionTensor = await this.model.predict(tensor_of_keypoints);
            const classifiedPoses = await this.getClassifiedPoses(predictionTensor,this.model_classes, this.model_classes.length);

            return classifiedPoses;
        }
    }

    async classifyPosesSorted (keypoints) {
        //use model to predict
        const array = this.formatArray(keypoints);
        const tensor_of_keypoints = tf.tensor(array);

        //If the model exists then do classification
        if(this.model) {
            const predictionTensor = this.model.predict(tensor_of_keypoints);
            const [poseNames, confidences] = this.getClassifiedPosesSorted(predictionTensor,this.model_classes, this.model_classes.length)[0];
            console.log(poseNames);
            console.log(confidences);

            return [poseNames, confidences];
        }
    }

    async getClassifiedPose (prediction, classes) {
        const {values, indices} = await prediction.topk();
        const topKValues = await values.data();
        const topKIndices = await indices.data();

        const poseName = classes[topKIndices[0]];
        const confidence = topKValues[0];

        return [poseName, confidence];
    }

    async getClassifiedPoses (prediction, classes, numPoses) {
        const {values, indices} = await prediction.topk(numPoses);
        const topKValues = await values.data();
        const topKIndices = await indices.data();

        console.log(topKValues);
        console.log(topKIndices);

        let poseObject = {
            classifiedPoses : [
                {
                    poseName:"",
                    confidence: 0.00,
                }
            ]
        };

        console.log(poseObject);
        for (let i = 0; i < topKIndices.length; i++) {
            poseObject.classifiedPoses[i].poseName = classes[topKIndices[i]];
            poseObject.classifiedPoses[i].confidence = topKValues[i];
        }

        return object;
    }

    async getClassifiedPosesSorted (prediction, classes, numPoses) {
        const {values, indices} = prediction.topk(numPoses, sorted=true);
        const topKValues = await values.data();
        const topKIndices = await indices.data();
    
        const poseNames = []
        const confidences = []

        for (let i = 0; i < topKIndices.length(); i++) {
            poseNames.push(classes[topKIndices[i]]);
            confidences.push(topKValues[i]);
        }
    
        return [poseNames, confidences];
    }
    
    formatArray(pose){
        let arr_expanded = new Array([])
        if (pose.length > 0) {
            //define a new array
            for (let i = 0; i < 33; i++) {
                arr_expanded[0].push(pose[0].keypoints3D[i]['x']);
                arr_expanded[0].push(pose[0].keypoints3D[i]['y']);
                arr_expanded[0].push(pose[0].keypoints3D[i]['z']);
            }
        }

        return arr_expanded
    }
}
