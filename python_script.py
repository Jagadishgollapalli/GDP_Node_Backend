import pandas as pd
import sys
import json

def process_csv(file_path):
    try:
        df = pd.read_csv(file_path)

        columns_to_drop = ['assessment type', 'submission date', 'attempt', 'assessment question', 'assessment question id', 'assignment url']
        df.drop(columns=columns_to_drop, inplace=True)
        print("Cleaning Progress")

        df[['course sis', 'section', 'year', 'crn']] = df['course sis id'].str.split('-', expand=True)
        df.drop(columns=['course sis id'], inplace=True)
        df['year'] = df['year'].str[:-2]
        df['intake'] = df['year'].str[:-2]

        df.rename(columns={'account name': 'school name', 'account id': 'school id'}, inplace=True)

        columns_to_drop = ['course sis', 'section', 'section sis id', 'submission score', 'learning outcome rating points', 'learning outcome mastery score', 'learning outcome mastered', 'learning outcome friendly name']
        df.drop(columns=columns_to_drop, inplace=True)

        df = df.reindex(columns=['crn', 'school_id', 'school_name', 'course_id', 'course_name', 'section_id', 'section_name', 'assessment_id', 'assessment_title', 'learning_outcome_id', 'learning_outcome_name', 'learning_outcome_points_possible', 'outcome_score', 'learning_outcome_rating', 'year', 'intake', 'enrollment_state'])

        mapping = {'10': 'Fall', '20': 'Spring', '30': 'Summer'}
        df['intake'] = df['intake'].replace(mapping)

        # Convert DataFrame to JSON
       # json_data = df.to_json(orient='records')
        print("Cleaning progress")

        # Print JSON data to stdout
        print(df.columns)

    except Exception as e:
        # Print error message to stderr
        sys.stderr.write("Error cleaning data: {}\n".format(str(e)))

if __name__ == "__main__":
    if len(sys.argv) != 2:
        # Print usage message to stderr
        sys.stderr.write("Usage: python script.py <file_path>\n")
        sys.exit(1)
    
    file_path = sys.argv[1]
    process_csv(file_path)
