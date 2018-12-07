#docker run -it -v ~/tmp/node_test:/TEST -p 8888:3000 --name NODETEST nodetest /bin/bash
FROM ubuntu:18.04

WORKDIR /TEST

RUN apt-get -y update && \
    apt-get -y upgrade 

RUN apt-get -y update &&\
    apt-get -my install wget gnupg

#vim install 
RUN apt-get -y update &&\
    apt-get -y install vim

RUN apt-get -y update &&\
    apt-get -y install npm


#npm install express
#npm install express-generator
    
