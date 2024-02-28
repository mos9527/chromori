#!/bin/sh

cd frontend
pnpm i
pnpm build
cd ..

cd backend
pnpm i
cd ..
