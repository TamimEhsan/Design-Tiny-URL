# Design a tiny url
URL shortening services like bit.ly or TinyURL are very popular to generate shorter aliases for long URLs. You need to design this kind of web service where if a user gives a long URL then the service returns a short URL and if the user gives a short URL then it returns the original long URL. 

For example, shortening the given URL through TinyURL: 

```
https://www.google.com
```

We get the result given below:
```
http://bit.ly/u5YqzmT
```
## Simple version
At first we will create a simple url shortener. This will ensure the bare minimum requirements and no additiional scalability, reliability, availabilty guarrantees. 

### API
```bash
GET / # Health check
GET /create/?url=long_url # shorten url
GET /short_url # redirect to the long url
```
### Database Schema

| Name    | Type |
| -------- | ------- |
| short_url (PK)  | varchar |    
| long_url | varchar     |


### Design
We have used a nodejs app for backend and postgreSQL as database. The backend exposes the three api documented above. For request of type 3, it checks if there is a entry for the short_url, if present then redirect to the long url, else return 404.  

For request of type 2, we at first generates a random string of length 7. Then we need to check for the uniqueness of this string. If it is already present, then we need to generate another one and continue untill we find a new random string not present in database. Then we will enter the short and long url in the database. But there might be a case where two parallel instances generated the same random string, checked that absence of that in database and then both of the tries to enter that in DB. Only one will succeed and other will fail due to primary key constraint. The probability is very low, but there is a chance.

### Ensuring uniqueness 
Multiple databases allow insert if absent feature ie if there is no entry for the primary key, then insert the row and return the newly created one, else if there is already a entry then return nothing. So based on the returned statement we can conclude if the row is inserted or not. The database ensures the atomicity of the operation. So there is no probability of collision.

### Running the app
At first run the database inside a docker container by
```
docker compose up -d
```
Then run the nodejs backend
```
cd backend
node index.js
```
Then you can open the `frontend/index.html` from a browser and try it. 
### Load testing
Load and capacity testing is done by Graphana k6. You can find more about it in their documentation.  

By some trial and error it is found that the system at this simple design can handle 2000 redirection requrest and 40 shortening request per second. 

At peak each request needs about 2.4 sec maximum and 1.9 sec average to respond. The maximum concurrent user is 4000 so throughput is 4000/2 = 2000 per second  

So, nodejs can handle lots of concurrent users but bottle neck is due to database. The 2.4 sec is due to database network time. Typically nodejs can handle lots of pg query by maintaining a pg connection pool. 

So, in the end the total number of successful write was about 2400 which means a throughput of 40 (as expected)
and the total number of reads was 105850 which means an throughput of 1764 (not bad, but we need to achieve 8000)