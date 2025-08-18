@@ .. @@
 -- Create analytics views
 CREATE VIEW course_analytics AS
 SELECT 
     c.id,
     c.title,
     COUNT(DISTINCT e.user_id) as total_students,
     COUNT(DISTINCT CASE WHEN e.progress_percentage = 100 THEN e.user_id END) as completed_students,
-    ROUND(
+    ROUND(CAST(
         (COUNT(DISTINCT CASE WHEN e.progress_percentage = 100 THEN e.user_id END)::float / 
-         NULLIF(COUNT(DISTINCT e.user_id), 0) * 100), 2
+         NULLIF(COUNT(DISTINCT e.user_id), 0) * 100) AS numeric), 2
     ) as completion_rate,
     AVG(e.progress_percentage) as avg_progress
 FROM courses c
 LEFT JOIN enrollments e ON c.id = e.course_id
 GROUP BY c.id, c.title;