#!/bin/sh

nohup node . >> discord.log 2>> discord.err &
echo $! > save_pid.txt
