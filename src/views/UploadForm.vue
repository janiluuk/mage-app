<template>
	<div id="dropzone">
		<DropZone class="drop-area" @files-dropped="addFiles" #default="{ dropZoneActive }">
			<label for="file-input">
				<span v-if="dropZoneActive">
					<span>Drop Them Here</span>
					<span class="smaller">to add them</span>
				</span>
				<span v-else>
					<span>Drag Your Files Here</span>
					<span class="smaller">
						or <strong><em>click here</em></strong> to select files
					</span>
				</span>

				<input type="file" id="file-input" multiple @change="onInputChange" />
			</label>
			<ul class="image-list" v-show="files.length">
				<FilePreview v-for="file of files" :key="file.id" :file="file" tag="li" @remove="removeFile" />
			</ul>
		</DropZone>
		<button @click.prevent="uploadFiles(files)" class="upload-button">Upload</button>
	</div>
</template>

<script>
import Navbar from "@/pages/PageLayout/Navbar.vue";
// Components
import DropZone from '../components/DropZone.vue'

// File Management
import useFileList from './compositions/file-list'
const { files, addFiles, removeFile } = useFileList()

function onInputChange(e) {
	addFiles(e.target.files)
	e.target.value = null // reset so that selecting the same file again will still cause it to fire this change
}

import showSwal from "@/mixins/showSwal";
const body = document.getElementsByTagName("body")[0];
import { mapMutations } from "vuex";
import { Form } from "vee-validate";
import * as Yup from 'yup';
import createUploader from './compositions/file-uploader';
const { uploadFiles } = createUploader('YOUR URL HERE');

export default {
    name: "UploadForm",
    components: {
        Navbar,
        MaterialInputField,
        MaterialCheckboxField,
        MaterialButton,
        Form,
    },
    data() {
        return {
            user: [],
            termsChecked: true,
            schema: Yup.object().shape({
                name: Yup.string().required("Name is a required input"),
                email: Yup.string().email("Email has to be a valid email address").required("Email is a required input"),
                password: Yup.string().required("Password is a required input").min(8, "Password must have at least 8 characters"),
                confirmPassword: Yup.string().required("Confirm password is a required input").oneOf([Yup.ref('password')], 'Your passwords do not match.'),
                checkbox: Yup.boolean().test('is-checked', 'You must agree to the terms and conditions', value => value === true)
            }),
        }
    },
    beforeMount() {
        this.toggleHideConfig();
        body.classList.remove("bg-gray-100");
    },
    beforeUnmount() {
        this.toggleHideConfig();
        body.classList.add("bg-gray-100");
    },
    methods: {
        ...mapMutations(["toggleEveryDisplay", "toggleHideConfig"]),
        async handleSignup() {
            try {
                await this.$store.dispatch('auth/register', this.user);
                showSwal.methods.showSwal({
                    type: "success",
                    message: "Successfully registered!",
                    width: 500
                });
                this.$router.push({ name: 'Profile' })
            } catch (error) {
                showSwal.methods.showSwal({
                    type: "error",
                    message: "Oops, something went wrong!",
                    width: 500
                });
            }
        },
    },
};
</script>


<style lang="stylus">
html {
	height: 100%;
	width: 100%;
	background-color: #b6d6f5;

	/* Overlapping Stripes Background, based off https://codepen.io/MinzCode/pen/Exgpqpe */
	--color1: rgba(55, 165, 255, 0.35);
	--color2: rgba(96, 181, 250, 0.35);
	--rotation: 135deg;
	--size: 10px;
	background-blend-mode: multiply;
	background-image: repeating-linear-gradient(
			var(--rotation),
			var(--color1) calc(var(--size) * 0),
			var(--color1) calc(var(--size) * 9),
			var(--color2) calc(var(--size) * 9),
			var(--color2) calc(var(--size) * 12),
			var(--color1) calc(var(--size) * 12)
		),
		repeating-linear-gradient(
			calc(var(--rotation) + 90deg),
			var(--color1) calc(var(--size) * 0),
			var(--color1) calc(var(--size) * 9),
			var(--color2) calc(var(--size) * 9),
			var(--color2) calc(var(--size) * 12),
			var(--color1) calc(var(--size) * 12)
		);
}

body {
	height: 100%;
	margin: 0;
	padding: 0;
}
</style>

<style scoped lang="stylus">
#dropzone {
	font-family: Helvetica, Arial, sans-serif;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	text-align: center;
	color: #2c3e50;
	margin: 0 auto;
	height: 100%;
	display: flex;
	flex-direction: column;
	justify-content: center;
}

.drop-area {
	width: 100%;
	max-width: 800px;
	margin: 0 auto;
	padding: 50px;
	background: #ffffff55;
	box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
	transition: .2s ease;

	&[data-active=true] {
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
		background: #ffffffcc;
	}
}

label {
	font-size: 36px;
	cursor: pointer;
	display: block;

	span {
		display: block;
	}

	input[type=file]:not(:focus-visible) {
		// Visually Hidden Styles taken from Bootstrap 5
		position: absolute !important;
		width: 1px !important;
		height: 1px !important;
		padding: 0 !important;
		margin: -1px !important;
		overflow: hidden !important;
		clip: rect(0, 0, 0, 0) !important;
		white-space: nowrap !important;
		border: 0 !important;
	}

	.smaller {
		font-size: 16px;
	}
}

.image-list {
	display: flex;
	list-style: none;
	flex-wrap: wrap;
	padding: 0;
}

.upload-button {
	display: block;
	appearance: none;
	border: 0;
	border-radius: 50px;
	padding: 0.75rem 3rem;
	margin: 1rem auto;
	font-size: 1.25rem;
	font-weight: bold;
	background: #369;
	color: #fff;
	text-transform: uppercase;
}

button {
	cursor: pointer;
}
</style>
