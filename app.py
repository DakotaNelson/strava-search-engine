from flask import Flask, render_template, url_for, jsonify
app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/namesearch/<query>')
def search_name(query):
    import pymongo
    client = pymongo.MongoClient()
    db = client.strava

    search_string = query

    name_pipeline = [
        {"$match":  {"$text": {"$search": search_string }}},
        #{"$limit": 10},
        {"$lookup": # find the associated user
            {
                "from": "users",
                "localField": "athlete_id",
                "foreignField": "user_id",
                "as": "user",
            }
        },
        {"$project": {"_id": 0, "activity_id": 1, "full_name": 1, "latlng": 1, "athlete_id": 1, "user": 1}}
    ]

    search_by_name = list(db.activity.aggregate(name_pipeline))

    for result in search_by_name:
        user = result['user'][0]
        user = {"avatar": user['avatar'], "user_url": user['user_url']}
        result['user'] = user

    return jsonify(search_by_name)
