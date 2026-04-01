<template>
  <div class="flex h-screen bg-gray-50">
    <Sidebar />
    <div class="flex-1 flex flex-col overflow-hidden">
      <Navbar />
      <main class="flex-1 overflow-y-auto p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ScheduleCard />
          <PDFList />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import Navbar from '../components/Navbar.vue';
import Sidebar from '../components/Sidebar.vue';
import ScheduleCard from '../components/ScheduleCard.vue';
import PDFList from '../components/PDFList.vue';
</script>
