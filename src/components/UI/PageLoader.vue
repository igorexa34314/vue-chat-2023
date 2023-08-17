<template>
	<div class="page-loader">
		<span class="loader d-inline-block"></span>
	</div>
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped>
$loader-primary: #0288d1;
$loader-secondary: #fdd835;
.page-loader {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	z-index: 50;
}
.loader {
	position: relative;
	width: 48px;
	height: 48px;
	border: 3px solid;
	border-color: transparent $loader-primary $loader-primary;
	border-radius: 50%;
	box-sizing: border-box;
	animation: rotation 1s linear infinite;
}
.loader::after {
	content: '';
	box-sizing: border-box;
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
	margin: auto;
	border: 3px solid;
	border-color: $loader-secondary $loader-secondary transparent;
	width: 24px;
	height: 24px;
	border-radius: 50%;
	animation: rotationBack 0.5s linear infinite;
	transform-origin: center center;
}

@keyframes rotation {
	0% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(360deg);
	}
}

@keyframes rotationBack {
	0% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(-360deg);
	}
}
</style>
