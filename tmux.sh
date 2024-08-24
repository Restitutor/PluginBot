#!/usr/bin/env fish


if test (count $argv) -ne 1
    echo "Usage: $(status -f) [start|stop|restart|attach]"
    exit 1
end

# Working directory
set basedir $(dirname (realpath (status -f )))
cd $basedir  # Only for duration of script
# Services or Servers
set typedir $(basename (dirname $basedir))
# service or servers
set typereadable $(string sub -e -1 (string lower $typedir))
# Name of folder
set session $(basename $basedir)

function attach
    echo "Attaching session $session..."
    tmux attach -t $session
end

function start
    echo "Starting $session $typereadable"
    tmux new-session -d -c "$basedir" -s "$session" "exec ~/sync/scripts/launchTmux.sh"
end

function stop
    if test "$typedir" = "Servers"
        /usr/bin/python3 /home/mcsa/curium/tools/stopServer.py "$basedir"
        echo "Stopping server..."
        /usr/bin/python3 /home/mcsa/curium/tools/IDLE.py "$basedir"
    else if test -e "pid"
        echo "Send gentle SIGINT"
        kill -2 $(cat "pid")
        sleep 5
    end
    tmux kill-session -t $session
    echo "$session $typereadable stopped"
end


switch $argv[1]
    case "sstart"
        start
    case "start"
        start
        attach
    case "stop"
        stop
    case "srestart"
	start
	stop
    case "restart"
	start
	stop
	attach
    case "attach"
        attach
    case '*'
	echo "Unknown argument $argv[1]"
end
