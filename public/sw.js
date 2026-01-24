self.addEventListener("push", event => {
  if (!event.data) return

  const data = event.data.json()

  self.registration.showNotification(data.title || "Notification", {
    body: data.body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [100, 50, 100]
  })
})

self.addEventListener("notificationclick", event => {
  event.notification.close()

  event.waitUntil(
    clients.openWindow("/")
  )
})
