// firebase-course-integration.js
// Add this to any course file to enable Firebase progress tracking

// Firebase configuration
// Your real configuration you copied earlier
export const firebaseConfig = {
  apiKey: "AIzaSyAnM53oo0Jah3Zg1Wxda-K6N5ddtYuJfQI",
  authDomain: "learnhub-4e07c.firebaseapp.com",
  databaseURL: "https://learnhub-4e07c-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "learnhub-4e07c",
  storageBucket: "learnhub-4e07c.firebasestorage.app",
  messagingSenderId: "561780501823",
  appId: "1:561780501823:web:b064c375c17ca618ee378a",
  measurementId: "G-XSW93XZBZ8"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const database = firebase.database();

// Get current user
let currentUser = null;
auth.onAuthStateChanged((user) => {
    currentUser = user;
    if (!user) {
        // Redirect to login if not authenticated
        // window.location.href = 'auth-firebase.html';
    }
});

// Save course progress to Firebase
function saveCourseProgress(courseId, progress) {
    if (!currentUser) {
        console.warn('User not authenticated. Saving to localStorage.');
        const progressData = JSON.parse(localStorage.getItem('learnhub_progress')) || {};
        progressData[courseId] = Math.min(progress, 100);
        localStorage.setItem('learnhub_progress', JSON.stringify(progressData));
        return;
    }

    // Save to Firebase
    const progressRef = database.ref('users/' + currentUser.uid + '/progress/' + courseId);
    progressRef.set(Math.min(progress, 100))
        .then(() => {
            console.log('✅ Progress saved to Firebase: Course ' + courseId + ' = ' + progress + '%');
        })
        .catch((error) => {
            console.error('❌ Error saving progress:', error);
            // Fallback to localStorage
            const progressData = JSON.parse(localStorage.getItem('learnhub_progress')) || {};
            progressData[courseId] = Math.min(progress, 100);
            localStorage.setItem('learnhub_progress', JSON.stringify(progressData));
        });
}

// Get course progress from Firebase
function getCourseProgress(courseId) {
    if (!currentUser) {
        // Use localStorage if not authenticated
        const progressData = JSON.parse(localStorage.getItem('learnhub_progress')) || {};
        return progressData[courseId] || 0;
    }

    // Get from Firebase
    return new Promise((resolve) => {
        const progressRef = database.ref('users/' + currentUser.uid + '/progress/' + courseId);
        progressRef.once('value')
            .then((snapshot) => {
                resolve(snapshot.val() || 0);
            })
            .catch(() => {
                // Fallback to localStorage
                const progressData = JSON.parse(localStorage.getItem('learnhub_progress')) || {};
                resolve(progressData[courseId] || 0);
            });
    });
}

// Listen to progress changes in real-time
function setupProgressListener(courseId, callback) {
    if (!currentUser) {
        console.log('User not authenticated. Real-time updates unavailable.');
        return;
    }

    const progressRef = database.ref('users/' + currentUser.uid + '/progress/' + courseId);
    progressRef.on('value', (snapshot) => {
        const progress = snapshot.val() || 0;
        callback(progress);
    });
}

// Update lesson and save progress
function showLesson(lessonId, lessonOrder, courseId) {
    // Calculate progress
    const currentIndex = lessonOrder.indexOf(lessonId);
    const progress = Math.round(((currentIndex + 1) / lessonOrder.length) * 100);
    
    // Save progress
    saveCourseProgress(courseId, progress);

    // Show lesson UI updates
    document.querySelectorAll('.lesson-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    const lessonElement = document.getElementById(lessonId);
    if (lessonElement) {
        lessonElement.classList.add('active');
    }
    
    if (event && event.target) {
        event.target.classList.add('active');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update progress display if it exists
    updateProgressDisplay(progress);
}

// Update progress display on UI
function updateProgressDisplay(progress) {
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        const fill = progressBar.querySelector('.progress-fill');
        if (fill) {
            fill.style.width = progress + '%';
        }
    }

    const progressPercent = document.querySelector('.progress-percent');
    if (progressPercent) {
        progressPercent.textContent = progress;
    }
}

// Export functions for use in HTML files
window.firebaseCourse = {
    saveCourseProgress,
    getCourseProgress,
    setupProgressListener,
    showLesson,
    updateProgressDisplay,
    currentUser: () => currentUser
};

console.log('✅ Firebase course integration loaded');
