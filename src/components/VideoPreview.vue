<style scoped>
	video{
		max-width: 400px;
		margin: auto;
	}
</style>

<template>
	<div class="container">
		<div>
			<h2>Video File Preview</h2>
			<hr/>
			<label>Video File
				<input type="file" accept="video/*" @change="handleFileUpload( $event )"/>
			</label>
			<br>
			<br>
			<button  class="btn btn-lead btn-xxl bg-gradient-vibrant" v-on:click="submitFile()">Submit File</button>
		</div>
	</div>
    <div id="videopreview-div" style="max-width:300px">
			    <video id="video-preview" controls v-show="file != ''"/>
    </div>
</template>

<script>
import axios from 'axios';
const API_URL = process.env.VUE_APP_API_BASE_URL;

	export default {
		data(){
			return {
				file: ''
			}
		},
		
		methods: {
			handleFileUpload( event ){
				this.file = event.target.files[0];
				this.previewVideo();
			},
			
			previewVideo(){
				let video = document.getElementById('video-preview');
				let reader = new FileReader();

				reader.readAsDataURL( this.file );
				reader.addEventListener('load', function(){
					video.src = reader.result;
				});
			},

			submitFile(){
				let formData = new FormData();
				
				formData.append('file', this.file);
				
				axios.post( API_URL + '/upload-video',
					formData,
					{
						headers: {
							'Content-Type': 'multipart/form-data'
						}
					}
				).then(function(){
					console.log('SUCCESS!!');
				})
				.catch(function(){
					console.log('FAILURE!!');
				});
			},
	

			uploadHandler(event) {
			this.videoFile = event.target.files[0];
			this.videoPreview = URL.createObjectURL(this.videoFile);
			this.uploadVideo();
			},
		
			async dropHandler(event) {
				event.preventDefault();
				this.videoFile = event.dataTransfer.files[0];
				this.videoPreview = URL.createObjectURL(this.videoFile);
				this.uploadVideo();
			},

			async uploadVideo() {
				// Code to upload the video file to the backend
			}
		}
	}

</script>

<style scoped>
.upload-area {
  width: 100%;
  height: 200px;
  border: 2px dashed #aaa;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 20px;
}
</style>

</script>
