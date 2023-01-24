<template>
	<v-layout class="app">
		<v-app-bar color="blue-grey-darken-4" :elevation="7" prominent>
			<v-app-bar-nav-icon variant="text" @click.stop="rail = !rail"></v-app-bar-nav-icon>
			<v-btn variant="text" icon="mdi-eye-off-outline" @click="drawer = !drawer"></v-btn>

			<v-toolbar-title>Чат комнаты 1</v-toolbar-title>

			<v-spacer></v-spacer>

			<v-btn variant="text" icon="mdi-magnify"></v-btn>

			<v-btn variant="text" icon="mdi-filter"></v-btn>

			<v-btn variant="text" icon="mdi-dots-vertical"></v-btn>
		</v-app-bar>

		<v-navigation-drawer v-model="drawer" location="left" :rail="rail" rail-width="85" width="320" @click="rail=!rail"
			permanent>
			<v-list lines="false">
				<v-list-item title="User 1">
					<template v-slot:prepend>
						<v-avatar image="https://cdn.vuetifyjs.com/images/john.png" variant="plain"
							style="pointer-events: none;">

						</v-avatar>
					</template>
				</v-list-item>
			</v-list>
		</v-navigation-drawer>

		<v-main>
			<slot />
		</v-main>
	</v-layout>
</template>

<script>
export default {
	setup() {

		const drawer = ref(true);
		const rail = ref(false);
		return {
			drawer, rail
		}
	}
}
</script>

<style lang="scss" scoped>

</style>